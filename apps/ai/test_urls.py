"""Mide la tasa de acierto de build_relatoria_url sobre una muestra real."""

import asyncio
import importlib.util
import random

import httpx

spec = importlib.util.spec_from_file_location("sc", "scripts/scraper.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


async def main():
    async with httpx.AsyncClient() as c:
        filas = await m.fetch_metadata(c, offset=0, limit=1000)
        print("muestra de metadatos:", len(filas))

        muestra = random.sample(filas, 12)
        ok = fallos = 0
        for r in muestra:
            sentencia = r.get("sentencia", "")
            fecha = r.get("fecha_sentencia", "")
            url = m.build_relatoria_url(sentencia, fecha)
            if not url:
                print(f"  SIN URL   {sentencia}")
                fallos += 1
                continue
            html, estado = await m.fetch_relatoria_html(c, url)
            if html:
                ok += 1
                print(f"  OK    {sentencia:12} {len(html):7} chars")
            else:
                fallos += 1
                print(f"  {estado:7} {sentencia:12} {url}")
            await asyncio.sleep(1.2)

        print(f"\ntasa de acierto: {ok}/{ok + fallos}")


asyncio.run(main())
