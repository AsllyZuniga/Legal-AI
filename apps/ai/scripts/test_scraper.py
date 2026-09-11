import asyncio
import httpx
import json
import uuid
from datetime import datetime
from bs4 import BeautifulSoup
import re

DB_URL = "postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai"
RELATORIA_BASE = "https://www.corteconstitucional.gov.co/relatoria"

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
    except Exception as e:
        print(f"  [ERROR] Parse error: {e}")
    return result

async def test():
    test_cases = [
        {"sentencia": "T-001/17", "fecha": "2017-01-16T00:00:00.000"},
        {"sentencia": "T-424/24", "fecha": "2024-10-09T00:00:00.000"},
        {"sentencia": "C-020/26", "fecha": "2026-02-14T00:00:00.000"},
    ]

    async with httpx.AsyncClient() as client:
        for tc in test_cases:
            url = build_relatoria_url(tc["sentencia"], tc["fecha"])
            print(f"\nTesting: {tc['sentencia']} -> {url}")
            resp = await client.get(url, timeout=30)
            print(f"  Status: {resp.status_code}")
            if resp.status_code == 200:
                text = resp.content.decode("windows-1252", errors="replace")
                has_sentencia = "Sentencia" in text
                has_resuelve = "RESUELVE" in text
                print(f"  Has 'Sentencia': {has_sentencia}")
                print(f"  Has 'RESUELVE': {has_resuelve}")
                print(f"  Text length: {len(text)}")
                parsed = parse_html_to_text(text)
                print(f"  Parsed full_text length: {len(parsed['full_text'])}")
            await asyncio.sleep(1)

asyncio.run(test())
