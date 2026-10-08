"""Prueba aislada de la descarga y el parser del scraper."""

import asyncio
import importlib.util

spec = importlib.util.spec_from_file_location("sc", "scripts/scraper.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

print("rate limit:", m.RATE_LIMIT, "| max fallos:", m.MAX_FALLOS_SEGUIDOS)
print("retries:", m.MAX_RETRIES, "| espera base:", m.RETRY_BASE_WAIT)
print("UA:", m.USER_AGENT[:55], "...")

URLS = [
    "https://www.corteconstitucional.gov.co/relatoria/2017/T-001-17.htm",
    "https://www.corteconstitucional.gov.co/relatoria/2018/C-001-18.htm",
    "https://www.corteconstitucional.gov.co/relatoria/2021/T-123-21.htm",
]


async def main():
    import httpx

    async with httpx.AsyncClient() as c:
        for u in URLS:
            html, estado = await m.fetch_relatoria_html(c, u)
            if not html:
                print(f"{estado:8} {u.split('/')[-1]}")
                continue
            p = m.parse_html_to_text(html)
            print(f"{estado:8} {u.split('/')[-1]:18} {len(html):7} chars | "
                  f"resuelve {len(p['resuelve']):5} | citas {len(p['cited_rulings']):3} | "
                  f"normas {len(p['referenced_norms']):2} | temas {len(p['themes']):2}")


asyncio.run(main())
