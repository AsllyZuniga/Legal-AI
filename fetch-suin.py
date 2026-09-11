#!/usr/bin/env python3
"""Fetch top 200 Colombian laws from SUIN-Juriscol (datos.gov.co)."""

import json
import sys
import urllib.request
import urllib.error
import psycopg2

DB_URL = "postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai"
DATASET_ID = "fiev-nid6"
API_BASE = f"https://www.datos.gov.co/resource/{DATASET_ID}.json"
LIMIT = 200


def fetch_json(url):
    """Fetch JSON from URL."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; LegalAI-Bot/1.0)",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def clean_text(val):
    """Clean a field value, return None if empty."""
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


def extract_law_number(name):
    """Try to extract a law number from the name."""
    import re
    m = re.search(r"(?:Ley|LEY)\s+(\d+)\s*(?:de\s+(\d{4}))?", name or "")
    if m:
        return m.group(1), m.group(2)
    m = re.search(r"(\d{3,4})\s+de\s+(\d{4})", name or "")
    if m:
        return m.group(1), m.group(2)
    return None, None


def determine_type(name, description):
    """Determine law type from name/description."""
    combined = f"{name or ''} {description or ''}".lower()
    types = [
        ("decreto", "Decreto"),
        ("resolución", "Resolución"),
        ("resolucion", "Resolución"),
        ("acuerdo", "Acuerdo"),
        ("ley", "Ley"),
        ("constitución", "Constitución"),
        "Constitución",
    ]
    for key, label in types:
        if key in combined:
            return label
    return "Ley"


def main():
    print(f"Fetching up to {LIMIT} laws from SUIN-Juriscol (datos.gov.co)...")

    # SUIN dataset fields vary; fetch with limit
    url = f"{API_BASE}?$limit={LIMIT}"
    try:
        records = fetch_json(url)
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Fetch error: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Retrieved {len(records)} records from API")

    if not records:
        print("No records returned.")
        return

    # Inspect first record to understand field names
    sample = records[0]
    print(f"Sample fields: {list(sample.keys())[:10]}")

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    inserted = 0
    skipped = 0

    for rec in records:
        # SUIN dataset fields: tipo, n_mero, a_o, sector, subtipo, vigencia, entidad, materia, art_culos
        tipo = clean_text(rec.get("tipo")) or "Ley"
        numero = clean_text(rec.get("n_mero")) or ""
        anio = clean_text(rec.get("a_o")) or ""
        sector = clean_text(rec.get("sector")) or ""
        materia = clean_text(rec.get("materia")) or ""
        vigencia = clean_text(rec.get("vigencia")) or ""
        entidad = clean_text(rec.get("entidad")) or ""
        art_culos = clean_text(rec.get("art_culos")) or ""

        name = f"{tipo} {numero} de {anio}" if numero and anio else tipo
        if not name or name.strip() == "Ley":
            skipped += 1
            continue

        is_vigente = vigencia.lower().startswith("vigente") if vigencia else True
        number_val = numero if numero else None
        year_val = int(anio) if anio and anio.isdigit() else None

        law_type = tipo

        source_url = None  # SUIN doesn't provide direct URLs

        # Check if already exists by name
        cur.execute("SELECT id FROM laws WHERE name = %s", (name,))
        if cur.fetchone():
            skipped += 1
            continue

        description = materia or f"{tipo} {sector}" if sector else tipo

        cur.execute(
            "INSERT INTO laws (id, name, number, year, type, description, source_url, is_vigente, embedding_status, created_at, updated_at) "
            "VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, 'pending', NOW(), NOW())",
            (name, number_val, year_val, law_type, description, source_url, is_vigente),
        )
        inserted += 1

    conn.commit()
    print(f"\nDone. Inserted: {inserted}, Skipped (duplicates/empty): {skipped}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
