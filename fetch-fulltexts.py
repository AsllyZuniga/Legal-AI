#!/usr/bin/env python3
"""Fetch full texts for rulings that have source_url but no full_text."""

import time
import re
import sys
import urllib.request
import urllib.error
from html.parser import HTMLParser
import psycopg2

DB_URL = "postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai"
BATCH_SIZE = 10
DELAY_BETWEEN_REQUESTS = 2


class TextExtractor(HTMLParser):
    """Extract visible text from HTML, skipping script/style tags."""

    def __init__(self):
        super().__init__()
        self._skip = False
        self._skip_tags = {"script", "style", "noscript"}
        self._pieces = []
        self._current = []

    def handle_starttag(self, tag, attrs):
        if tag in self._skip_tags:
            self._skip = True

    def handle_endtag(self, tag):
        if tag in self._skip_tags:
            self._skip = False

    def handle_data(self, data):
        if not self._skip:
            self._current.append(data)

    def flush_block(self):
        text = " ".join(self._current).strip()
        self._current.clear()
        if text:
            self._pieces.append(text)

    def get_text(self):
        self.flush_block()
        return "\n".join(self._pieces)


def extract_text_from_html(html_bytes, url):
    """Decode HTML bytes and extract readable text."""
    # Try common encodings for Colombian gov sites
    for enc in ("utf-8", "latin-1", "cp1252", "iso-8859-1"):
        try:
            html_str = html_bytes.decode(enc)
            break
        except (UnicodeDecodeError, LookupError):
            continue
    else:
        html_str = html_bytes.decode("utf-8", errors="replace")

    extractor = TextExtractor()
    try:
        extractor.feed(html_str)
    except Exception:
        # Malformed HTML: strip tags with regex fallback
        clean = re.sub(r"<[^>]+>", " ", html_str)
        clean = re.sub(r"\s+", " ", clean).strip()
        return clean, None

    full_text = extractor.get_text()

    # Collapse excessive whitespace
    full_text = re.sub(r"[ \t]+", " ", full_text)
    full_text = re.sub(r"\n{3,}", "\n\n", full_text)

    # Extract resuelve / falla section
    resuelve = None
    patterns = [
        r"(?i)(RESUELVE[:\s].*)",
        r"(?i)(FALLA[:\s].*)",
        r"(?i)(DECIDE[:\s].*)",
    ]
    for pat in patterns:
        m = re.search(pat, full_text)
        if m:
            # Grab from marker to end (or next major section)
            start = m.start()
            chunk = full_text[start:start + 3000]
            # Try to find end of section
            end_markers = ["NOTIFÍQUESE", "NOTIFIQUESE", "COMUNÍQUESE", "PUBLÍQUESE", "CÚMPLASE"]
            end_pos = len(chunk)
            for em in end_markers:
                idx = chunk.upper().find(em)
                if idx != -1 and idx < end_pos:
                    end_pos = idx
            resuelve = chunk[:end_pos].strip()
            break

    return full_text, resuelve


def fetch_url(url, retries=2):
    """Fetch URL content with retries. Returns (bytes, status) or (None, status)."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; LegalAI-Bot/1.0)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read(), resp.status
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None, 404
            if attempt < retries:
                time.sleep(2 * (attempt + 1))
                continue
            return None, e.code
        except (urllib.error.URLError, OSError) as e:
            if attempt < retries:
                time.sleep(2 * (attempt + 1))
                continue
            print(f"  [ERROR] {url}: {e}", file=sys.stderr)
            return None, 0
    return None, 0


def main():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    # Count pending
    cur.execute(
        "SELECT COUNT(*) FROM rulings WHERE source_url IS NOT NULL "
        "AND (full_text IS NULL OR full_text = '')"
    )
    total = cur.fetchone()[0]
    print(f"Rulings pending full-text fetch: {total}")

    if total == 0:
        print("Nothing to do.")
        cur.close()
        conn.close()
        return

    processed = 0
    skipped_404 = 0
    errors = 0

    while processed < total:
        # Fetch next batch
        cur.execute(
            "SELECT id, source_url FROM rulings "
            "WHERE source_url IS NOT NULL AND (full_text IS NULL OR full_text = '') "
            "ORDER BY id LIMIT %s",
            (BATCH_SIZE,),
        )
        rows = cur.fetchall()
        if not rows:
            break

        for ruling_id, source_url in rows:
            print(f"[{processed + 1}/{total}] Ruling {ruling_id}: {source_url[:80]}...")

            html_bytes, status = fetch_url(source_url)

            if status == 404:
                print(f"  -> 404 Not Found, skipping")
                skipped_404 += 1
                processed += 1
                continue

            if html_bytes is None:
                print(f"  -> Failed (status {status}), skipping")
                errors += 1
                processed += 1
                continue

            full_text, resuelve = extract_text_from_html(html_bytes, source_url)

            if not full_text or len(full_text) < 50:
                print(f"  -> Extracted text too short ({len(full_text or '')} chars), skipping")
                errors += 1
                processed += 1
                continue

            cur.execute(
                "UPDATE rulings SET full_text = %s, resuelve = %s, updated_at = NOW() WHERE id = %s",
                (full_text, resuelve, ruling_id),
            )
            conn.commit()
            print(f"  -> Saved ({len(full_text)} chars)" + (f", resuelve: {len(resuelve)} chars" if resuelve else ""))
            processed += 1

            time.sleep(DELAY_BETWEEN_REQUESTS)

    print(f"\nDone. Processed: {processed}, 404s: {skipped_404}, Errors: {errors}")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
