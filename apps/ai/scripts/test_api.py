import asyncio
import httpx
import json

async def test():
    async with httpx.AsyncClient() as c:
        r = await c.get('https://www.datos.gov.co/resource/v2k4-2t8s.json', params={
            '$where': "fecha_sentencia>='2017-01-01'",
            '$order': 'fecha_sentencia ASC',
            '$limit': '3'
        }, timeout=30)
        for item in r.json():
            print(json.dumps(item, indent=2))

asyncio.run(test())
