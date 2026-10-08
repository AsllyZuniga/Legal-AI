import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'ai'))

from scripts.scraper import fetch_relatoria_html, parse_html_to_text, es_cita_valida
import asyncpg
import os
from dotenv import load_dotenv

ROOT_DOTENV = ROOT / '.env'
load_dotenv(dotenv_path=ROOT_DOTENV, override=False)
DB_URL = os.getenv('DATABASE_URL', 'postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai')

async def main():
    try:
        with open(ROOT / 'scripts' / 'curate_hitos.txt', encoding='utf-8') as f:
            citas = [line.strip() for line in f if line.strip()]
    except Exception as e:
        print('error', e); return
    pool = await asyncpg.create_pool(DB_URL, min_size=1, max_size=2)
    try:
        for c in citas:
            if not es_cita_valida(c): print('skip', c); continue
            async with pool.acquire() as conn:
                row = await conn.fetchrow('SELECT id, citation, full_text FROM rulings WHERE lower(citation)=', c.lower())
                if not row: print('no bd', c); continue
                if row['full_text']: print('tiene', c); continue
            print('desc', c)
            html, estado = await fetch_relatoria_html(c, retries=5, backoff_base=1.8)
            if estado != 'ok' or not html: print('fallo', estado, c); await asyncio.sleep(1.2); continue
            datos = parse_html_to_text(html) or {}
            if not datos.get('full_text'): print('sinparse', c); await asyncio.sleep(1.2); continue
            async with pool.acquire() as conn:
                await conn.execute('UPDATE rulings SET full_text=, resuelve=, summary=, themes=, magistrate_ponent=, referenced_norms=, cited_rulings=, metadata=metadata||::jsonb, updated_at=now() WHERE id=',
                    datos.get('full_text'), datos.get('resuelve'), datos.get('summary'), datos.get('themes') or [],
                    datos.get('magistrate_ponent'), datos.get('referenced_norms') or [], datos.get('cited_rulings') or [],
                    {'parser':'curated_ingest_v1'}, row['id'])
            print('OK', c); await asyncio.sleep(1.2)
    finally:
        await pool.close()
    print('fin')

if __name__ == '__main__':
    asyncio.run(main())