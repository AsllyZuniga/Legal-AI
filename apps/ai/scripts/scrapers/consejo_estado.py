"""
Scraper para Consejo de Estado de Colombia
Fuentes:
- Mi Relatoria (SAMAI): https://samai.consejodeestado.gov.co/TitulacionRelatoria/BuscadorProvidenciasTituladas.aspx
  (Desde Diciembre 2021 en adelante)
- Consulta Tradicional: https://servicios.consejodeestado.gov.co/WebRelatoria/ce/index.xhtml
  (Antes de Diciembre 2021)
- Jurisprudencia Cruzada: https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/consulta/index.xhtml

No tiene API publica. Se requiere headless browser.
PDFs descargables desde Mi Relatoria (descarga masiva o individual).
"""

import asyncio
import asyncpg
import aiohttp
import os
from datetime import datetime

DB_URL = os.getenv("DATABASE_URL", "postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai")
CE_MI_RELATORIA_URL = "https://samai.consejodeestado.gov.co/TitulacionRelatoria/BuscadorProvidenciasTituladas.aspx"
CE_TRADICIONAL_URL = "https://servicios.consejodeestado.gov.co/WebRelatoria/ce/index.xhtml"


async def insert_ce_ruling(pool: asyncpg.Pool, data: dict) -> bool:
    async with pool.acquire() as conn:
        existing = await conn.fetchval(
            "SELECT id FROM rulings WHERE citation = $1 AND source = 'consejo_estado'",
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
            "Consejo de Estado",
            data.get("chamber"),
            data.get("section"),
            data.get("magistrate_ponent"),
            data.get("ruling_date"),
            data.get("legal_area"),
            data.get("themes", "[]"),
            data.get("summary"),
            data.get("full_text"),
            data.get("source_url"),
            "consejo_estado",
            data.get("pdf_url"),
            data.get("download_urls", "{}"),
            data.get("radicado"),
            data.get("referenced_norms", "[]"),
            data.get("cited_rulings", "[]"),
            data.get("metadata", "{}"),
        )
        return True


async def scrape_ce_with_playwright(pool: asyncpg.Pool):
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("[WARN] Playwright no instalado. Ejecuta: pip install playwright && playwright install chromium")
        print("[INFO] Usando modo de demostracion...")
        await demo_insert(pool)
        return

    print("[INFO] Iniciando scraping con Playwright...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print(f"[INFO] Cargando Mi Relatoria...")
        try:
            await page.goto(CE_MI_RELATORIA_URL, timeout=30000)
            await page.wait_for_load_state("networkidle")
            print(f"[OK] Mi Relatoria cargada")
        except Exception as e:
            print(f"[ERROR] No se pudo cargar Mi Relatoria: {e}")
            print(f"[INFO] Intentando consulta tradicional...")
            try:
                await page.goto(CE_TRADICIONAL_URL, timeout=30000)
                await page.wait_for_load_state("networkidle")
                print(f"[OK] Consulta tradicional cargada")
            except Exception as e2:
                print(f"[ERROR] No se pudo cargar consulta tradicional: {e2}")
                await browser.close()
                await demo_insert(pool)
                return

        await browser.close()


async def demo_insert(pool: asyncpg.Pool):
    demo_data = [
        {
            "citation": "CE-S3-2024-001",
            "ruling_type": "Sentencia",
            "process_type": "Nulidad y Restablecimiento",
            "section": "Seccion Tercera",
            "magistrate_ponent": "Consejero Demo",
            "ruling_date": datetime(2024, 3, 20),
            "legal_area": "Administrativo",
            "themes": '["CONTRATO ESTATAL", "RESPONSABILIDAD"]',
            "summary": "Sentencia de demostracion para la Seccion Tercera del Consejo de Estado.",
            "source_url": CE_MI_RELATORIA_URL,
            "metadata": '{"demo": true}',
        },
    ]

    for data in demo_data:
        inserted = await insert_ce_ruling(pool, data)
        if inserted:
            print(f"  [OK] Insertada: {data['citation']}")
        else:
            print(f"  [SKIP] Ya existe: {data['citation']}")


async def main():
    print("=" * 60)
    print("SCRAPER CONSEJO DE ESTADO")
    print("Fuente: Mi Relatoria (SAMAI) + Consulta Tradicional")
    print("=" * 60)

    pool = await asyncpg.create_pool(DB_URL, min_size=2, max_size=5)
    print(f"[OK] Connected to database")

    await scrape_ce_with_playwright(pool)

    async with pool.acquire() as conn:
        total = await conn.fetchval("SELECT COUNT(*) FROM rulings WHERE source = 'consejo_estado'")
        print(f"\n{'=' * 60}")
        print(f"Total sentencias Consejo de Estado en BD: {total}")
        print(f"{'=' * 60}")

    await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
