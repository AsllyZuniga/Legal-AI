import asyncio
import asyncpg
import httpx
import json
import re
import time
import uuid
from datetime import datetime
from bs4 import BeautifulSoup

DB_URL = "postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai"
DATOS_API = "https://www.datos.gov.co/resource/v2k4-2t8s.json"
RELATORIA_BASE = "https://www.corteconstitucional.gov.co/relatoria"
RATE_LIMIT = 1.0

def build_relatoria_url(sentencia: str, fecha: str) -> str:
    if not sentencia or not fecha:
        return ""
    year_full = fecha[:4]
    parts = sentencia.split("/")
    if len(parts) != 2:
        return ""
    tipo_num = parts[0]
    year_short = parts[1][-2:]
    return f"{RELATORIA_BASE}/{year_full}/{tipo_num}-{year_short}.htm"

def parse_html_to_text(html: str) -> dict:
    result = {"full_text": "", "summary": "", "resuelve": "", "themes": []}
    try:
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "head"]):
            tag.decompose()

        text = soup.get_text(separator="\n", strip=True)
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        result["full_text"] = text.strip()

        temas_section = ""
        resuelve_section = ""

        lines = text.split("\n")
        capturing_temas = False
        capturing_resuelve = False
        temas_lines = []
        resuelve_lines = []

        for i, line in enumerate(lines):
            line_clean = line.strip()
            if not line_clean:
                continue

            if "TEMAS" in line_clean.upper() and "SUBTEMAS" in line_clean.upper():
                capturing_temas = True
                capturing_resuelve = False
                continue
            elif "RESUELVE" in line_clean.upper() or "R E S U E L V E" in line_clean.upper():
                capturing_temas = False
                capturing_resuelve = True
                continue
            elif line_clean.startswith("Sentencia ") and "/" in line_clean:
                if capturing_temas:
                    temas_lines.append(line_clean)
                capturing_temas = False
                continue

            if capturing_temas:
                temas_lines.append(line_clean)
            if capturing_resuelve:
                resuelve_lines.append(line_clean)

        if temas_lines:
            temas_text = " ".join(temas_lines[:20])
            temas_clean = re.findall(r'[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\-]{5,}', temas_text)
            result["themes"] = [t.strip() for t in temas_clean if len(t.strip()) > 5][:15]

        if resuelve_lines:
            result["resuelve"] = "\n".join(resuelve_lines[:50]).strip()

        if len(text) > 200:
            summary_candidates = []
            for line in lines:
                lc = line.strip()
                if len(lc) > 50 and len(lc) < 500 and not lc.startswith("Sentencia"):
                    summary_candidates.append(lc)
            if summary_candidates:
                result["summary"] = " ".join(summary_candidates[:3])[:800]

    except Exception as e:
        print(f"  [ERROR] Parse error: {e}")
    return result

async def fetch_metadata(client: httpx.AsyncClient, offset: int = 0, limit: int = 1000) -> list:
    params = {
        "$where": "fecha_sentencia>='2017-01-01'",
        "$order": "fecha_sentencia ASC",
        "$offset": str(offset),
        "$limit": str(limit),
    }
    try:
        resp = await client.get(DATOS_API, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  [ERROR] Fetch metadata offset={offset}: {e}")
        return []

async def fetch_relatoria_html(client: httpx.AsyncClient, url: str) -> str:
    if not url:
        return ""
    try:
        resp = await client.get(url, timeout=30)
        if resp.status_code != 200:
            return ""
        text = resp.content.decode("windows-1252", errors="replace")
        if "Sentencia" not in text and "RESUELVE" not in text:
            return ""
        return text
    except Exception as e:
        print(f"  [ERROR] Fetch {url}: {e}")
        return ""

async def upsert_ruling(pool: asyncpg.Pool, data: dict):
    try:
        await pool.execute("""
            INSERT INTO rulings (
                id, citation, ruling_type, process_type, corporation,
                chamber, magistrate_ponent, ruling_date, legal_area,
                themes, summary, full_text, resuelve, source_url,
                source_type, radicado, embedding_status, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14,
                $15, $16, $17, NOW(), NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                full_text = COALESCE($12, rulings.full_text),
                summary = COALESCE($11, rulings.summary),
                resuelve = COALESCE($13, rulings.resuelve),
                themes = COALESCE($10, rulings.themes),
                source_url = COALESCE($14, rulings.source_url),
                updated_at = NOW()
        """,
            data["id"], data["citation"], data["ruling_type"], data["process_type"],
            data["corporation"], data["chamber"], data["magistrate_ponent"],
            data["ruling_date"], data["legal_area"],
            json.dumps(data["themes"]), data["summary"], data["full_text"],
            data["resuelve"], data["source_url"],
            data["source_type"], data["radicado"], data["embedding_status"]
        )
    except Exception as e:
        print(f"  [ERROR] Upsert {data.get('citation', '?')}: {e}")

async def main():
    print("=" * 60)
    print("SCRAPER: Corte Constitucional 2017-2026")
    print("=" * 60)

    pool = await asyncpg.create_pool(DB_URL, min_size=2, max_size=5)
    print("[OK] DB pool created")

    async with httpx.AsyncClient() as client:
        print("[1/3] Fetching metadata from datos.gov.co...")
        all_rulings = []
        offset = 0
        while True:
            batch = await fetch_metadata(client, offset=offset, limit=1000)
            if not batch:
                break
            all_rulings.extend(batch)
            print(f"  Fetched {len(all_rulings)} rulings so far...")
            if len(batch) < 1000:
                break
            offset += 1000

        print(f"  Total metadata: {len(all_rulings)} rulings")

        existing = await pool.fetch("SELECT citation FROM rulings WHERE corporation = 'corte_constitucional'")
        existing_citations = {r["citation"] for r in existing}
        print(f"  Existing in DB: {len(existing_citations)}")

        to_process = []
        for r in all_rulings:
            sentencia = r.get("sentencia", "")
            fecha = r.get("fecha_sentencia", "")
            if not sentencia:
                continue
            url = build_relatoria_url(sentencia, fecha)
            to_process.append({
                "sentencia": sentencia,
                "fecha": fecha,
                "url": url,
                "exists": sentencia in existing_citations,
                "magistrado": r.get("magistrado_a", ""),
                "radicado": r.get("expediente_numero", ""),
                "proceso": r.get("proceso", ""),
            })

        needs_text = [r for r in to_process if not r["exists"]]
        already_exists = [r for r in to_process if r["exists"]]
        print(f"  New to insert: {len(needs_text)}")
        print(f"  Already exists: {len(already_exists)}")

        print("\n[2/3] Processing new rulings...")
        processed = 0
        errors = 0
        for i, ruling in enumerate(needs_text):
            sentencia = ruling["sentencia"]
            url = ruling["url"]
            fecha = ruling["fecha"]

            ruling_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"corte-{sentencia}"))

            process_type = "Tutela" if sentencia.startswith("T-") else \
                           "Demanda de inconstitucionalidad" if sentencia.startswith("C-") else \
                           "Decreto Legislativo" if sentencia.startswith("D-") else \
                           "Otro"

            tipo = "sentencia" if sentencia.startswith(("T-", "C-", "SU-")) else "auto"

            chamber = ""
            if sentencia.startswith("T-"):
                chamber = "Sala de Revisión"
            elif sentencia.startswith("C-"):
                chamber = "Sala Plena"
            elif sentencia.startswith("SU-"):
                chamber = "Sala Plena"

            ruling_date = None
            if fecha:
                try:
                    ruling_date = datetime.fromisoformat(fecha.replace("T", " ").replace("Z", ""))
                except:
                    pass

            html = ""
            if url:
                html = await fetch_relatoria_html(client, url)
                await asyncio.sleep(RATE_LIMIT)

            parsed = parse_html_to_text(html) if html else {}

            data = {
                "id": ruling_id,
                "citation": sentencia,
                "ruling_type": tipo,
                "process_type": ruling.get("proceso", process_type),
                "corporation": "corte_constitucional",
                "chamber": chamber,
                "magistrate_ponent": ruling.get("magistrado", ""),
                "ruling_date": ruling_date,
                "legal_area": "constitucional",
                "themes": parsed.get("themes", []),
                "summary": parsed.get("summary", ""),
                "full_text": parsed.get("full_text", ""),
                "resuelve": parsed.get("resuelve", ""),
                "source_url": url,
                "source_type": "official",
                "radicado": ruling.get("radicado", ""),
                "embedding_status": "pending",
            }

            await upsert_ruling(pool, data)
            processed += 1

            has_text = "YES" if parsed.get("full_text") else "NO"
            if processed % 10 == 0 or processed == 1:
                print(f"  [{processed}/{len(needs_text)}] {sentencia} - text: {has_text} - {url}")

        print(f"\n  Processed: {processed} new rulings")

        print("\n[3/3] Updating existing rulings without full_text...")
        missing_text = await pool.fetch("""
            SELECT id, citation, source_url FROM rulings 
            WHERE corporation = 'corte_constitucional' 
            AND (full_text IS NULL OR full_text = '')
            AND source_url IS NOT NULL AND source_url != '' AND source_url != 'https://test.com'
            ORDER BY ruling_date DESC
            LIMIT 500
        """)
        print(f"  Found {len(missing_text)} rulings missing full_text")

        updated = 0
        for row in missing_text:
            url = row["source_url"]
            html = await fetch_relatoria_html(client, url)
            await asyncio.sleep(RATE_LIMIT)

            if html:
                parsed = parse_html_to_text(html)
                if parsed.get("full_text"):
                    await pool.execute("""
                        UPDATE rulings SET 
                            full_text = $1, 
                            summary = COALESCE(NULLIF(summary, ''), $2),
                            resuelve = COALESCE(NULLIF(resuelve, ''), $3),
                            themes = CASE WHEN themes = '[]'::jsonb THEN $4 ELSE themes END,
                            updated_at = NOW()
                        WHERE id = $5
                    """, parsed["full_text"], parsed.get("summary", ""),
                       parsed.get("resuelve", ""), json.dumps(parsed.get("themes", [])),
                       row["id"])
                    updated += 1
                    if updated % 10 == 0:
                        print(f"  [{updated}/{len(missing_text)}] Updated {row['citation']}")

        print(f"  Updated: {updated} rulings with full_text")

    await pool.close()

    total = await asyncpg.create_pool(DB_URL, min_size=1, max_size=1)
    count = await total.fetchval("SELECT COUNT(*) FROM rulings WHERE corporation = 'corte_constitucional'")
    with_text = await total.fetchval("SELECT COUNT(*) FROM rulings WHERE corporation = 'corte_constitucional' AND full_text IS NOT NULL AND full_text != ''")
    await total.close()

    print("\n" + "=" * 60)
    print(f"RESULTADO FINAL:")
    print(f"  Total sentencias CC: {count}")
    print(f"  Con texto completo: {with_text}")
    print(f"  Sin texto: {count - with_text}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
