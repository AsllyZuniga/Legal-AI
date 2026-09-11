"""
Scraper para Corte Suprema de Justicia de Colombia
Fuente: consultaprovidencias.cortesuprema.gov.co + archivodigitalapi.cortesuprema.gov.co

URLs:
- Busqueda: https://consultaprovidencias.cortesuprema.gov.co/
- PDFs: https://archivodigitalapi.cortesuprema.gov.co/share/{YEAR}/{MONTH}/Sentencias/{FILENAME}.pdf

No tiene API publica. Se requiere headless browser para busqueda.
Los PDFs son descargables directamente si se conoce la URL.
"""

import asyncio
import asyncpg
import aiohttp
import os
import re
from typing import Optional
from datetime import datetime

DB_URL = os.getenv("DATABASE_URL", "postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai")
CSJ_SEARCH_URL = "https://consultaprovidencias.cortesuprema.gov.co"
CSJ_PDF_BASE = "https://archivodigitalapi.cortesuprema.gov.co/share"


async def check_pdf_available(session: aiohttp.ClientSession, url: str) -> bool:
    try:
        async with session.head(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            return resp.status == 200
    except:
        return False


def build_csj_citation(sala: str, numero: str, ano: int) -> str:
    sala_prefix = ""
    if "civil" in sala.lower():
        sala_prefix = "SC"
    elif "laboral" in sala.lower():
        sala_prefix = "SL"
    elif "penal" in sala.lower():
        sala_prefix = "SP"
    elif "plena" in sala.lower():
        sala_prefix = "SP"
    else:
        sala_prefix = "CSJ"
    return f"{sala_prefix}-{numero}-{ano}"


async def insert_csj_ruling(pool: asyncpg.Pool, data: dict) -> bool:
    async with pool.acquire() as conn:
        existing = await conn.fetchval(
            "SELECT id FROM rulings WHERE citation = $1 AND source = 'corte_suprema'",
            data.get("citation", "")
        )
        if existing:
            return False

        await conn.execute(
            """INSERT INTO rulings (
                citation, ruling_type, process_type, corporation, chamber, section,
                magistrate_ponent, ruling_date, legal_area, themes, summary,
                full_text, source_url, source, pdf_url, download_urls,
                radicado, referenced_norms, cited_rulings, metadata,
                created_at, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW(),NOW())""",
            data.get("citation"),
            data.get("ruling_type", "Sentencia"),
            data.get("process_type"),
            "Corte Suprema de Justicia",
            data.get("chamber"),
            data.get("section"),
            data.get("magistrate_ponent"),
            data.get("ruling_date"),
            data.get("legal_area"),
            data.get("themes", "[]"),
            data.get("summary"),
            data.get("full_text"),
            data.get("source_url"),
            "corte_suprema",
            data.get("pdf_url"),
            data.get("download_urls", "{}"),
            data.get("radicado"),
            data.get("referenced_norms", "[]"),
            data.get("cited_rulings", "[]"),
            data.get("metadata", "{}"),
        )
        return True


async def scrape_csj_with_playwright(pool: asyncpg.Pool, max_pages: int = 5):
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("[WARN] Playwright no instalado. Ejecuta: pip install playwright && playwright install chromium")
        print("[INFO] Usando modo de demostracion con datos de ejemplo...")
        await demo_insert(pool)
        return

    print("[INFO] Iniciando scraping con Playwright...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto(CSJ_SEARCH_URL, timeout=30000)
        await page.wait_for_load_state("networkidle")

        print(f"[OK] Pagina de busqueda cargada")

        for sala in ["Civil", "Laboral", "Penal"]:
            print(f"\n[INFO] Buscando en Sala {sala}...")
            try:
                await page.fill("input[name='texto']", "")
                await page.select_option("select[name='sala']", label=sala)
                await page.click("button[type='submit']")
                await page.wait_for_load_state("networkidle")

                results = await page.query_selector_all(".resultado-item, .search-result, tr[data-href]")
                print(f"  Encontrados {len(results)} resultados para {sala}")

                for i, result in enumerate(results[:20]):
                    text = await result.inner_text()
                    links = await result.query_selector_all("a")
                    href = None
                    for link in links:
                        h = await link.get_attribute("href")
                        if h and ("pdf" in h.lower() or "sentencia" in h.lower()):
                            href = h
                            break

                    print(f"  [{i+1}] {text[:80]}...")

            except Exception as e:
                print(f"  [ERROR] Error buscando en {sala}: {e}")

        await browser.close()


async def demo_insert(pool: asyncpg.Pool):
    demo_data = [
        {
            "citation": "SC-1234-2024",
            "ruling_type": "Sentencia",
            "process_type": "Casacion Civil",
            "chamber": "Sala de Casacion Civil",
            "magistrate_ponent": "Magistrado Demo",
            "ruling_date": datetime(2024, 6, 15),
            "legal_area": "Civil",
            "themes": '["RESPONSABILIDAD CIVIL", "CONTRATO"]',
            "summary": "Sentencia de demostracion para la Sala Civil de la Corte Suprema.",
            "source_url": f"{CSJ_SEARCH_URL}/",
            "metadata": '{"demo": true}',
        },
    ]

    for data in demo_data:
        inserted = await insert_csj_ruling(pool, data)
        if inserted:
            print(f"  [OK] Insertada: {data['citation']}")
        else:
            print(f"  [SKIP] Ya existe: {data['citation']}")


async def main():
    print("=" * 60)
    print("SCRAPER CORTE SUPREMA DE JUSTICIA")
    print("Fuente: consultaprovidencias.cortesuprema.gov.co")
    print("=" * 60)

    pool = await asyncpg.create_pool(DB_URL, min_size=2, max_size=5)
    print(f"[OK] Connected to database")

    await scrape_csj_with_playwright(pool)

    async with pool.acquire() as conn:
        total = await conn.fetchval("SELECT COUNT(*) FROM rulings WHERE source = 'corte_suprema'")
        print(f"\n{'=' * 60}")
        print(f"Total sentencias Corte Suprema en BD: {total}")
        print(f"{'=' * 60}")

    await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
