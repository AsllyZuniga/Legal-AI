"""
Scraper para SUIN-Juriscol (Sistema Unico de Informacion Normativa)
Fuente: datos.gov.co API (Socrata) + suin-juriscol.gov.co

Dataset: https://www.datos.gov.co/Justicia-y-Derecho/Lista-de-normas-cargadas-en-el-Sistema-nico-de-Inf/fiev-nid6
API: https://www.datos.gov.co/resource/fiev-nid6.json

Campos disponibles:
- tipo: Tipo de norma (Decreto, Ley, Acto legislativo, etc.)
- numero: Numero de la norma
- ano: Ano de expedicion
- sector: Sector asociado
- subtipo: Subtipo (para decretos y leyes)
- vigencia: Vigencia de la norma
- entidad: Entidad emisora
- materia: Materia
- articulos: Numero de articulos
"""

import asyncio
import asyncpg
import aiohttp
import os
import sys
import time
import uuid
from typing import Optional

SOCRATA_API_URL = "https://www.datos.gov.co/resource/fiev-nid6.json"
DB_URL = os.getenv("DATABASE_URL", "postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai")

BATCH_SIZE = 100
MAX_LIMIT = 5000


async def fetch_norms_batch(session: aiohttp.ClientSession, offset: int, limit: int) -> list:
    params = {
        "$limit": limit,
        "$offset": offset,
        "$order": "a_o DESC, n_mero DESC",
    }
    try:
        async with session.get(SOCRATA_API_URL, params=params, timeout=aiohttp.ClientTimeout(total=30)) as resp:
            if resp.status == 200:
                return await resp.json()
            else:
                text = await resp.text()
                print(f"  [WARN] HTTP {resp.status} at offset {offset}: {text[:200]}")
                return []
    except Exception as e:
        print(f"  [ERROR] Fetch error at offset {offset}: {e}")
        return []


def build_norm_name(row: dict) -> str:
    tipo = row.get("tipo", "Norma")
    numero = row.get("n_mero", row.get("numero", ""))
    ano = row.get("a_o", row.get("ano", ""))
    if numero and ano:
        return f"{tipo} {numero} de {ano}"
    elif numero:
        return f"{tipo} {numero}"
    elif ano:
        return f"{tipo} de {ano}"
    return tipo


def map_tipo_to_source(tipo: str) -> str:
    tipo_lower = tipo.lower() if tipo else ""
    if "constitucion" in tipo_lower:
        return "constitucion"
    elif "ley" in tipo_lower:
        return "ley"
    elif "decreto" in tipo_lower:
        return "decreto"
    elif "acto legislativo" in tipo_lower or "acto" in tipo_lower:
        return "acto_legislativo"
    elif "resolucion" in tipo_lower:
        return "resolucion"
    elif "circular" in tipo_lower:
        return "circular"
    elif "directiva" in tipo_lower:
        return "directiva_presidencial"
    return "otra_norma"


async def insert_norms(pool: asyncpg.Pool, norms: list[dict]) -> int:
    inserted = 0
    async with pool.acquire() as conn:
        for row in norms:
            name = build_norm_name(row)
            tipo = row.get("tipo", "")
            numero = row.get("n_mero", row.get("numero"))
            ano_str = row.get("a_o", row.get("ano"))
            ano = int(ano_str) if ano_str and str(ano_str).isdigit() else None
            sector = row.get("sector")
            subtipo = row.get("subtipo")
            entidad = row.get("entidad")
            materia = row.get("materia")
            vigencia = row.get("vigencia")
            articulos_str = row.get("articulos")
            articulos = int(articulos_str) if articulos_str and str(articulos_str).isdigit() else None

            source_url = None
            if numero and ano:
                source_url = f"https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Normas/{numero}_{ano}"

            try:
                existing = await conn.fetchval(
                    "SELECT id FROM laws WHERE name = $1 AND source = 'suin_juriscol'",
                    name
                )
                if existing:
                    continue

                await conn.execute(
                    """INSERT INTO laws (id, name, number, year, type, subtipo, sector, entidad, materia,
                       articulos, vigencia, source_url, source, is_vigente, created_at, updated_at)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())""",
                    str(uuid.uuid4()), name, numero, ano, tipo, subtipo, sector, entidad, materia,
                    articulos, vigencia, source_url, "suin_juriscol",
                    vigencia and "vigent" in str(vigencia).lower() if vigencia else True
                )
                inserted += 1
            except Exception as e:
                print(f"  [ERROR] Insert error for {name}: {e}")
                continue
    return inserted


async def main():
    print("=" * 60)
    print("SCRAPER SUIN-JURISCOL (Normativa Colombiana)")
    print("Fuente: datos.gov.co API (Socrata)")
    print("=" * 60)

    pool = await asyncpg.create_pool(DB_URL, min_size=2, max_size=5)
    print(f"[OK] Connected to database")

    total_inserted = 0
    offset = 0
    page = 0

    async with aiohttp.ClientSession() as session:
        while True:
            page += 1
            print(f"\n[Page {page}] Fetching offset={offset}, limit={MAX_LIMIT}...")

            batch = await fetch_norms_batch(session, offset, MAX_LIMIT)

            if not batch:
                print(f"[DONE] No more results at offset {offset}")
                break

            print(f"  Fetched {len(batch)} norms")

            inserted = await insert_norms(pool, batch)
            total_inserted += inserted

            print(f"  Inserted {inserted} new norms (skipped {len(batch) - inserted} duplicates)")
            print(f"  Total inserted so far: {total_inserted}")

            if len(batch) < MAX_LIMIT:
                print(f"[DONE] Last batch reached ({len(batch)} < {MAX_LIMIT})")
                break

            offset += MAX_LIMIT
            await asyncio.sleep(0.5)

    async with pool.acquire() as conn:
        total_in_db = await conn.fetchval("SELECT COUNT(*) FROM laws WHERE source = 'suin_juriscol'")
        print(f"\n{'=' * 60}")
        print(f"SCRAPER COMPLETADO")
        print(f"Total normas SUIN-Juriscol en BD: {total_in_db}")
        print(f"Nuevas insertadas en esta ejecucion: {total_inserted}")
        print(f"{'=' * 60}")

    await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
