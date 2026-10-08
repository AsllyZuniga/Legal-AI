"""Verifica que el servidor MCP responde por stdio, como lo usara OpenCode.

No toca la sesion de opencode: solo confirma que el handshake y las llamadas
funcionan con el mismo comando que figura en .opencode/opencode.json.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

COMANDO = [
    str(RAIZ / "apps" / "mcp" / ".venv" / "Scripts" / "python.exe"),
    str(RAIZ / "apps" / "mcp" / "server.py"),
]


async def main():
    params = StdioServerParameters(
        command=COMANDO[0],
        args=COMANDO[1:],
        env={
            **os.environ,
            "DATABASE_URL": "postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai",
        },
    )

    async with stdio_client(params) as (lee, escribe):
        async with ClientSession(lee, escribe) as sesion:
            info = await sesion.initialize()
            print("servidor:", info.server_info.name, info.server_info.version)
            print("instrucciones:", (info.instructions or "")[:80], "...")

            herramientas = await sesion.list_tools()
            print(f"\nherramientas ({len(herramientas.tools)}):")
            for t in herramientas.tools:
                print("  -", t.name)

            print("\n--- llamada real: buscar_sentencias ---")
            r = await sesion.call_tool(
                "buscar_sentencias",
                {"consulta": "derecho a la vida", "limite": 2},
            )
            datos = r.structured_content or json.loads(r.content[0].text)
            print("encontrado:", datos["encontrado"], "| total:", datos["total_devuelto"])
            for x in datos["resultados"]:
                print(f"  * {x['cita']} | {x['fecha']} | {x['ponente']}")
                print(f"    {x['url_oficial']}")

            print("\n--- llamada real: obtener_sentencia ---")
            if datos["resultados"]:
                cita = datos["resultados"][0]["cita"]
                r2 = await sesion.call_tool(
                    "obtener_sentencia", {"cita": cita, "incluir_texto": False}
                )
                d2 = r2.structured_content or json.loads(r2.content[0].text)
                print("encontrado:", d2["encontrado"], "|", d2.get("cita"))
                print("resuelve:", (d2.get("resuelve") or "")[:120].replace("\n", " "))

            print("\n--- honestidad: sentencia inexistente ---")
            r3 = await sesion.call_tool("obtener_sentencia", {"cita": "T-999/99"})
            d3 = r3.structured_content or json.loads(r3.content[0].text)
            print("encontrado:", d3["encontrado"])
            print("advertencia:", d3.get("advertencia"))

            print("\n--- estadisticas ---")
            r4 = await sesion.call_tool("estadisticas", {})
            d4 = r4.structured_content or json.loads(r4.content[0].text)
            print(json.dumps(d4["sentencias"], ensure_ascii=False, indent=2))

            print("\nTODO OK: el servidor MCP funciona por stdio")


if __name__ == "__main__":
    asyncio.run(main())
