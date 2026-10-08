"""
Servidor MCP de Legal AI: acceso a la jurisprudencia y la normativa colombiana.

Se expone a OpenCode por stdio. Cada herramienta devuelve datos de la base con
su `source_url` para que el agente pueda citar la fuente oficial y no invente.

Reglas de diseno:
- Nunca inventar radicados, articulos ni sentencias. Si el dato no esta, la
  herramienta lo dice explicitamente con `encontrado: false`.
- La busqueda hibrida combina tsvector (espanol), trigram (aproximaciones de
  radicado/cita) y, si ya hay embeddings, distancia coseno sobre los chunks.
- El servidor arranca aunque el corpus este vacio o falten embeddings: en ese
  caso degrada a busqueda textual y lo advierte en la respuesta.
"""

import os
import re
import json
from pathlib import Path
from typing import Any, Optional

import asyncpg
from mcp.server.mcpserver import MCPServer

# --- Configuracion ---------------------------------------------------------

ROOT = Path(__file__).resolve().parents[2]


def _cargar_dotenv() -> None:
    """Lee el .env de la raiz del monorepo sin depender de python-dotenv."""
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for linea in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        linea = linea.strip()
        if not linea or linea.startswith("#") or "=" not in linea:
            continue
        clave, _, valor = linea.partition("=")
        clave = clave.strip()
        valor = valor.strip().strip('"').strip("'")
        os.environ.setdefault(clave, valor)


_cargar_dotenv()

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai",
)

# El agente juridico no debe reventar la ventana de contexto con una providencia
# de 200k caracteres: se recorta y se declara el recorte.
MAX_FULL_TEXT_CHARS = int(os.getenv("MCP_MAX_FULL_TEXT_CHARS", "12000"))

# Fase 1.6 — red de seguridad. Ninguna consulta del agente puede quedarse
# colgada bloqueando el pool, ni devolver miles de filas.
STATEMENT_TIMEOUT_MS = int(os.getenv("MCP_STATEMENT_TIMEOUT_MS", "10000"))
MAX_LIMIT = int(os.getenv("MCP_MAX_LIMIT", "50"))
HARD_LIMIT = 200  # techo absoluto; por encima se ignora el parametro del agente

_pool: Optional[asyncpg.Pool] = None


async def _configurar_conexion(conn: asyncpg.Connection) -> None:
    """asyncpg devuelve `json`/`jsonb` como texto; lo que queremos son listas.

    Sin este codec, `cited_rulings` llega como la cadena '["T-1/99"]' y al
    iterarla se obtienen caracteres sueltos en vez de providencias.
    """
    for tipo in ("json", "jsonb"):
        await conn.set_type_codec(
            tipo,
            encoder=json.dumps,
            decoder=json.loads,
            schema="pg_catalog",
        )
    # Toda consulta se corta a los 10 s aunque el agente pida algo absurdo.
    await conn.execute(
        f"SET statement_timeout = {STATEMENT_TIMEOUT_MS}"
    )
    # El rol del MCP es de solo lectura (Fase 1.6). Esto es la segunda barrera,
    # despues de las consultas parametrizadas.
    await conn.execute("SET default_transaction_read_only = on")


def _limite(valor: Optional[int], defecto: int = 10) -> int:
    """Acota el LIMIT pedido por el agente al rango permitido."""
    if valor is None:
        return defecto
    return max(1, min(int(valor), MAX_LIMIT, HARD_LIMIT))


async def db() -> asyncpg.Pool:
    """Pool de conexiones, creado en el primer uso."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            DB_URL, min_size=1, max_size=5, init=_configurar_conexion
        )
    return _pool


# --- Utilidades ------------------------------------------------------------


def _a_cita_canonica(cita: str) -> Optional[str]:
    """Normaliza una cita a su forma inequivoca: `T-473-2017`.

    Debe producir EXACTAMENTE lo mismo que la columna generada
    `citation_canonical` de la migracion 003. Si divergen, la busqueda
    exacta falla en silencio, que es el peor fallo posible.

    La regla de siglo replica la del SQL: anio de 2 digitos mayor que 91
    es 19xx, si no 20xx (la Corte arranca en 1991).
    """
    cita = (cita or "").strip()
    if not cita:
        return None

    # "T-760 de 2008" y "T 760 08" se reducen al mismo esqueleto que usa
    # la columna generada: TIPO [sep] NUM [sufijo] [sep] ANIO
    esqueleto = re.sub(r"\bde\b", "/", cita, flags=re.IGNORECASE)
    esqueleto = re.sub(r"\s+", "", esqueleto)

    m = re.match(
        r"^(SU|SC|T|C|A)[-/]?([0-9]{1,5})([A-Za-z]?)[-/]?([0-9]{2,4})$",
        esqueleto,
        re.IGNORECASE,
    )
    if not m:
        return None

    tipo, numero, sufijo, anio = m.groups()
    if len(anio) == 4:
        anio4 = anio
    else:
        anio4 = ("19" if int(anio) > 91 else "20") + anio

    return f"{tipo.upper()}-{numero}{sufijo.upper()}-{anio4}"


def _variantes_legadas(cita: str) -> list:
    """Variantes contra la columna `citation` cruda, SOLO por igualdad exacta.

    No es busqueda aproximada: son las grafias que podria tener guardadas
    la fila. Se mantiene como red de seguridad para registros antiguos
    cargados antes de la migracion 003.
    """
    canonica = _a_cita_canonica(cita)
    variantes = []
    if canonica:
        tipo, resto = canonica.split("-", 1)
        numero_sufijo, anio = resto.rsplit("-", 1)
        corto = anio[-2:]
        variantes = [
            f"{tipo}-{numero_sufijo}/{corto}".lower(),
            f"{tipo}-{numero_sufijo}/{anio}".lower(),
            f"{tipo}-{numero_sufijo}-{corto}".lower(),
            f"{tipo}-{numero_sufijo} de {anio}".lower(),
            f"{tipo}-{numero_sufijo}-{anio}".lower(),
        ]
    else:
        variantes = [re.sub(r"\s", "", cita).lower()]
    return list(dict.fromkeys(variantes))


def _recortar(texto: Optional[str], limite: int) -> dict:
    """Recorta texto largo indicando que hubo recorte."""
    if not texto:
        return {"texto": "", "recortado": False, "caracteres": 0}
    if len(texto) <= limite:
        return {"texto": texto, "recortado": False, "caracteres": len(texto)}
    return {
        "texto": texto[:limite],
        "recortado": True,
        "caracteres": len(texto),
        "nota": (
            f"Se muestran los primeros {limite} de {len(texto)} caracteres. "
            "Pide `fragmento` con un desplazamiento para seguir leyendo."
        ),
    }


def _ficha_ruling(row: asyncpg.Record) -> dict:
    """Proyeccion compacta y citable de una providencia."""
    return {
        "cita": row["citation"],
        "tipo": row["ruling_type"],
        "proceso": row["process_type"],
        "corporacion": row["corporation"],
        "sala": row["chamber"],
        "ponente": row["magistrate_ponent"],
        "fecha": row["ruling_date"].isoformat() if row["ruling_date"] else None,
        "radicado": row["radicado"],
        "temas": row["themes"] or [],
        "resumen": row["summary"],
        "resuelve": _recortar(row["resuelve"], 4000)["texto"],
        "normas_citadas": row["referenced_norms"] or [],
        "providencias_citadas": row["cited_rulings"] or [],
        "url_oficial": row["source_url"],
        "tiene_texto_completo": bool(row["full_text"]),
    }


# --- Servidor --------------------------------------------------------------

server = MCPServer(
    name="legal-ai",
    title="Legal AI - Jurisprudencia y normativa colombiana",
    version="1.0.0",
    instructions=(
        "Base de datos juridica colombiana (Corte Constitucional y SUIN).\n"
        "Usa estas herramientas ANTES de citar jurisprudencia o normas.\n"
        "Regla absoluta: si una herramienta devuelve `encontrado: false` o un "
        "campo vacio, esa providencia o articulo no esta en la base: dilo "
        "explicitamente y no completes el dato de memoria.\n"
        "Cita siempre con `cita`, `fecha`, `ponente` y `url_oficial`.\n"
        "La base de normas tiene metadatos, pero el texto integro de los "
        "articulos puede no estar cargado: usa `obtener_ley` para verificar."
    ),
)


# ============================ JURISPRUDENCIA ==============================


@server.tool(
    description=(
        "Busca sentencias por concepto. Usa esto primero para cualquier consulta "
        "juridica. Filtros opcionales: `proceso` (Tutela, Demanda de "
        "inconstitucionalidad), `desde`/`hasta` (AAAA-MM-DD), `ponente`."
    )
)
async def buscar_sentencias(
    consulta: str,
    limite: int = 10,
    proceso: Optional[str] = None,
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
    ponente: Optional[str] = None,
) -> dict:
    limite = _limite(limite)
    pool = await db()

    # Si lo que llego es una cita, no hay nada que "buscar": se resuelve de
    # forma exacta o se dice que no existe. Nunca se aproxima en silencio.
    canonica = _a_cita_canonica(consulta)
    if canonica:
        fila = await pool.fetchrow(
            "SELECT * FROM rulings WHERE citation_canonical = $1 LIMIT 1",
            canonica,
        )
        if fila:
            return {
                "consulta": consulta,
                "modo": "cita_exacta",
                "exacta": True,
                "encontrado": True,
                "total_devuelto": 1,
                "resultados": [{**_ficha_ruling(fila), "puntaje": 1.0}],
            }
        sugerencias = await _sugerir_por_trigram(pool, consulta)
        return {
            "consulta": consulta,
            "modo": "cita_exacta",
            "exacta": False,
            "encontrado": False,
            "total_devuelto": 0,
            "resultados": [],
            "sugerencias": sugerencias,
            "advertencia": (
                f"No existe ninguna providencia con la cita {canonica}. "
                "No la cites como si la hubieras leido. "
                + (
                    "Estas son las mas parecidas por similaridad de texto; "
                    "puede que quisieras una de ellas."
                    if sugerencias
                    else "No hay ni siquiera una cita parecida en la base."
                )
            ),
        }

    cond: list = []
    params: list = []
    # websearch_to_tsquery tolera frases y comillas sin lanzar error de sintaxis.
    params.append(consulta)
    cond.append("search_vector @@ websearch_to_tsquery('spanish', $1)")

    if proceso:
        params.append(f"%{proceso}%")
        cond.append(f"process_type ILIKE ${len(params)}")
    if desde:
        params.append(desde)
        cond.append(f"ruling_date >= ${len(params)}::date")
    if hasta:
        params.append(hasta)
        cond.append(f"ruling_date <= ${len(params)}::date")
    if ponente:
        params.append(f"%{ponente}%")
        cond.append(f"magistrate_ponent ILIKE ${len(params)}")

    where = " AND ".join(cond)
    # Fase 1.3 — el sesgo por longitud era real: los textos promedian 130 KB
    # y el mayor llega a 3 MB, asi que sin damping una providencia larguisima
    # ganaba cualquier consulta por el solo hecho de contener mas palabras.
    #   - ts_rank_cd(..., 32) acota el puntaje a 0..1
    #   - el logaritmo atenua el efecto del tamano sin anularlo (1+ln(kb))
    #   - CASE prioriza T/C/SU sobre autos. Ojo: `ruling_type` vale 'sentencia'
    #     en las 5.288 filas, asi que la signal va por el prefijo de la cita.
    sql = f"""
        SELECT citation, ruling_type, process_type, corporation, chamber,
               magistrate_ponent, ruling_date, radicado, themes, summary,
               resuelve, referenced_norms, cited_rulings, source_url,
               full_text, citation_canonical,
               ts_rank_cd(search_vector, websearch_to_tsquery('spanish', $1), 32)
                 / (1 + ln(greatest(length(coalesce(full_text, '')), 1)) / 1000.0)
                 * CASE WHEN citation_canonical ~ '^(T|C|SU)' THEN 1.15 ELSE 1.0 END
                   AS puntaje
        FROM rulings
        WHERE {where}
        ORDER BY puntaje DESC, ruling_date DESC
        LIMIT ${len(params) + 1}
    """
    params.append(limite)

    filas = await pool.fetch(sql, *params)

    respuesta = {
        "consulta": consulta,
        "modo": "concepto",
        "exacta": None,
        "encontrado": bool(filas),
        "total_devuelto": len(filas),
        "resultados": [
            {
                **_ficha_ruling(f),
                "cita_canonica": f["citation_canonical"],
                "puntaje": round(float(f["puntaje"]), 4),
            }
            for f in filas
        ],
    }

    if not filas:
        respuesta["advertencia"] = (
            "Sin coincidencias. La Corte Constitucional esta cargada desde 2017; "
            "puede que la providencia sea anterior o no exista."
        )
    return respuesta


async def _buscar_por_cita(pool: asyncpg.Pool, cita: str, *columnas: str):
    """Resuelve una cita de forma EXACTA. Devuelve la fila o None.

    Orden de resolucion:
      1. `citation_canonical` (indice unico). Ahi vive el formato T-473-2017.
      2. Igualdad exacta sobre `citation` para filas anteriores a la 003.
      3. Igualdad exacta sobre `radicado`.

    Nunca trigram, nunca similitud. T-473/17 y T-474/17 son providencias
    distintas y el agente no puede recibir una por otra.
    """
    cols = ", ".join(columnas)
    canonica = _a_cita_canonica(cita)
    if canonica:
        fila = await pool.fetchrow(
            f"SELECT {cols} FROM rulings WHERE citation_canonical = $1 LIMIT 1",
            canonica,
        )
        if fila is not None:
            return fila
    variantes = _variantes_legadas(cita)
    if not variantes:
        return None
    return await pool.fetchrow(
        f"""
        SELECT {cols} FROM rulings
        WHERE lower(citation) = ANY($1::text[])
           OR lower(coalesce(radicado, '')) = $2
        LIMIT 1
        """,
        variantes,
        (cita or "").strip().lower(),
    )


async def _sugerir_por_trigram(
    pool: asyncpg.Pool,
    consulta: str,
    max_sugerencias: int = 5,
) -> list:
    """Fase 1.2: el trigram SUGIERE, nunca devuelve.

    Antes esta funcion alimentaba `resultados` y el agente podia citar
    T-473/17 cuando el usuario pidio T-474/17. Ahora su unico uso es
    telling al humano que probablemente quiso decir otra cosa.
    """
    filas = await pool.fetch(
        """
        SELECT citation, citation_canonical, process_type, ruling_date
        FROM rulings
        WHERE greatest(
                similarity(citation, $1),
                similarity(coalesce(citation_canonical, ''), $1),
                similarity(coalesce(radicado, ''), $1)
              ) > 0.3
        ORDER BY 3 DESC
        LIMIT $2
        """,
        consulta,
        min(max_sugerencias, HARD_LIMIT),
    )
    return [
        {
            "cita": f["citation"],
            "canonica": f["citation_canonical"],
            "proceso": f["process_type"],
            "fecha": f["ruling_date"].isoformat() if f["ruling_date"] else None,
        }
        for f in filas
    ]


@server.tool(
    description=(
        "Devuelve UNA providencia completa por su cita (T-760/08, C-041/17) o "
        "radicado. Acepta T-760/08, T-760-2008, 'T-760 de 2008' y t 760 08. "
        "Si la cita no existe devuelve sugerencias, NUNCA una providencia "
        "aproximada. Incluye el texto integro; usar `fragmento` para textos largos."
    )
)
async def obtener_sentencia(cita: str, incluir_texto: bool = True) -> dict:
    pool = await db()
    canonica = _a_cita_canonica(cita)
    variantes = _variantes_legadas(cita)
    if not canonica and not variantes:
        return {
            "encontrado": False,
            "error": "Cita vacia o con formato no reconocido.",
            "formato_esperado": "T-760/08, C-041/17, SU-123/09 o el radicado",
        }

    # Primero la columna canonica (indice unico). Despues, igualdad exacta
    # sobre `citation` para registros viejos. Nada de trigram aqui.
    fila = None
    if canonica:
        fila = await pool.fetchrow(
            "SELECT * FROM rulings WHERE citation_canonical = $1 LIMIT 1",
            canonica,
        )
    if fila is None:
        fila = await pool.fetchrow(
            """
            SELECT * FROM rulings
            WHERE lower(citation) = ANY($1::text[])
               OR ($2 <> '' AND lower(coalesce(radicado, '')) = $2)
            LIMIT 1
            """,
            variantes,
            cita.strip().lower(),
        )

    if fila is None:
        sugerencias = await _sugerir_por_trigram(pool, cita)
        return {
            "encontrado": False,
            "exacta": False,
            "consultado": cita,
            "consultado_canonico": canonica,
            "sugerencias": sugerencias,
            "advertencia": (
                "Esa providencia no esta en la base. No la cites como si lo "
                "estuviera: informa que no se encontro el texto oficial. "
                + (
                    "Citas parecidas (NO son la que pediste): "
                    + ", ".join(s["cita"] for s in sugerencias)
                    if sugerencias
                    else "No hay citas similares cargadas."
                )
            ),
        }

    resultado = _ficha_ruling(fila)
    resultado["encontrado"] = True
    resultado["exacta"] = True
    resultado["cita_canonica"] = fila["citation_canonical"]
    resultado["tiene_texto_completo"] = bool(fila["full_text"])
    # Fase 1.4: se expone el origen real del resumen para que el agente
    # nunca lo presente como ratio oficial de la Relatoria.
    resultado["resumen_origen"] = fila["summary_source"]

    if incluir_texto and fila["full_text"]:
        recorte = _recortar(fila["full_text"], MAX_FULL_TEXT_CHARS)
        resultado["texto_completo"] = recorte
    else:
        resultado["texto_completo"] = {
            "texto": "",
            "recortado": False,
            "caracteres": 0,
            "nota": "El texto completo no esta cargado para esta providencia.",
        }
    return resultado


@server.tool(
    description=(
        "Lee un fragmento de la providencia por posicion, util cuando el texto "
        "completo fue recortado. Devuelve el numero de fragmento y si hay mas."
    )
)
async def fragmento_sentencia(cita: str, indice: int = 0, largo: int = 6000) -> dict:
    pool = await db()
    largo = max(500, min(largo, 20000))
    inicio = max(0, indice) * largo

    fila = await _buscar_por_cita(pool, cita, "citation", "citation_canonical", "full_text")
    if fila is None:
        sugerencias = await _sugerir_por_trigram(pool, cita)
        return {
            "encontrado": False,
            "exacta": False,
            "consultado": cita,
            "sugerencias": sugerencias,
            "error": "Esa providencia no esta en la base.",
        }
    if not fila["full_text"]:
        return {"encontrado": True, "cita": fila["citation"], "sin_texto": True}

    texto = fila["full_text"]
    trozo = texto[inicio : inicio + largo]
    return {
        "encontrado": True,
        "cita": fila["citation"],
        "indice": indice,
        "offset_caracteres": inicio,
        "total_caracteres": len(texto),
        "hay_mas": inicio + largo < len(texto),
        "siguiente_indice": indice + 1 if inicio + largo < len(texto) else None,
        "fragmento": trozo,
    }


@server.tool(
    description=(
        "Devuelve la jurisprudencia que una providencia cita y que SI esta "
        "cargada en la base. Excelente para seguir una linea doctrinal. "
        "Distingue entre 'citada y disponible' y 'citada pero no disponible'."
    )
)
async def jurisprudencia_relacionada(cita: str, limite: int = 20) -> dict:
    pool = await db()
    limite = _limite(limite, 20)

    fila = await _buscar_por_cita(
        pool, cita, "citation", "citation_canonical", "cited_rulings", "source_url"
    )
    if fila is None:
        return {"encontrado": False, "exacta": False, "consultado": cita}

    # La cabecera de la providencia repite su propia cita, asi que el extractor
    # la recoge como autorreferencia. El filtro ahora compara canonicos, que
    # no dependen de como este escrita la cita en cada documento.
    propias = {_a_cita_canonica(fila["citation"]), fila["citation"].lower()}
    propias.discard(None)
    citadas = [
        c
        for c in (fila["cited_rulings"] or [])
        if (_a_cita_canonica(c) or c.lower()) not in propias
    ]
    if not citadas:
        return {
            "encontrado": True,
            "cita": fila["citation"],
            "total_citadas": 0,
            "disponibles": [],
            "no_disponibles": [],
            "nota": "Esta providencia no registra providencias citadas en su texto.",
        }

    disponibles = await pool.fetch(
        """
        SELECT citation, process_type, ruling_date, magistrate_ponent, source_url
        FROM rulings
        WHERE lower(citation) = ANY($1::text[])
        ORDER BY ruling_date DESC
        LIMIT $2
        """,
        [c.lower() for c in citadas],
        limite,
    )
    encontradas = {d["citation"].lower() for d in disponibles}
    faltantes = [c for c in citadas if c.lower() not in encontradas]

    return {
        "encontrado": True,
        "cita": fila["citation"],
        "url_oficial": fila["source_url"],
        "total_citadas": len(citadas),
        "disponibles": [
            {
                "cita": d["citation"],
                "proceso": d["process_type"],
                "fecha": d["ruling_date"].isoformat() if d["ruling_date"] else None,
                "ponente": d["magistrate_ponent"],
                "url_oficial": d["source_url"],
            }
            for d in disponibles
        ],
        "no_disponibles": faltantes,
        "nota": (
            "'no_disponibles' son providencias citadas cuyo texto no esta "
            "cargado (anteriores a 2017 o de otra corporacion). No las cites "
            "como si su texto hubiera sido verificado."
        ),
    }


@server.tool(
    description=(
        "Lista las normas (leyes, decretos) citadas por una providencia y, en "
        "sentido inverso, que providencias cargadas citan una norma concreta."
    )
)
async def normas_referenciadas(
    norma: Optional[str] = None, cita: Optional[str] = None, limite: int = 20
) -> dict:
    pool = await db()
    limite = _limite(limite, 20)

    if cita:
        fila = await _buscar_por_cita(
            pool, cita, "citation", "citation_canonical", "referenced_norms", "source_url"
        )
        if fila is None:
            return {"encontrado": False, "exacta": False, "consultado": cita}
        normas = fila["referenced_norms"] or []
        return {
            "encontrado": True,
            "cita": fila["citation"],
            "url_oficial": fila["source_url"],
            "normas_citadas": normas,
            "total": len(normas),
            "nota": "Extraccion automatica del texto: puede omitir normas "
            "citadas solo de forma implicita.",
        }

    if norma:
        # Sentido inverso: que providencias citan esta norma.
        # El codec jsonb del pool se encarga de serializar, por eso se pasa la
        # lista de Python y no json.dumps (que la codificaria dos veces).
        filas = await pool.fetch(
            """
            SELECT citation, process_type, ruling_date, source_url
            FROM rulings
            WHERE referenced_norms @> $1::jsonb
            ORDER BY ruling_date DESC
            LIMIT $2
            """,
            [norma],
            limite,
        )
        total = await pool.fetchval(
            "SELECT count(*) FROM rulings WHERE referenced_norms @> $1::jsonb",
            [norma],
        )
        return {
            "encontrado": bool(filas),
            "norma": norma,
            "total_providencias_que_la_citan": total,
            "devueltas": len(filas),
            "providencias": [
                {
                    "cita": f["citation"],
                    "proceso": f["process_type"],
                    "fecha": f["ruling_date"].isoformat() if f["ruling_date"] else None,
                    "url_oficial": f["source_url"],
                }
                for f in filas
            ],
        }

    return {
        "encontrado": False,
        "error": "Indica `cita` (normas que cita esa providencia) o `norma` "
        "(providencias que citan esa norma).",
    }


# ================================ NORMATIVA ================================


@server.tool(
    description=(
        "Busca normas por nombre, numero, anio o materia (SUIN, 88.000+ "
        "registros). Para el articulo exacto usa despues `obtener_ley`."
    )
)
async def buscar_normas(
    consulta: str, limite: int = 10, solo_vigentes: bool = False
) -> dict:
    limite = _limite(limite)
    pool = await db()

    cond = ["search_vector @@ websearch_to_tsquery('spanish', $1)"]
    params: list = [consulta]
    if solo_vigentes:
        cond.append("is_vigente = true")
    params.append(limite)

    filas = await pool.fetch(
        f"""
        SELECT id, name, number, year, type, sector, entidad, materia,
               articulos, vigencia, is_vigente, description, source_url, source,
               full_text
        FROM laws
        WHERE {' AND '.join(cond)}
        ORDER BY
            -- El numero de ley es el dato mas preciso: "Ley 599 de 2000".
            CASE
                WHEN lower(name) = lower($1) THEN 0
                WHEN ('ley ' || number) = lower($1) THEN 1
                ELSE 2
            END,
            length(name)
        LIMIT ${len(params)}
        """,
        *params,
    )

    if not filas:
        filas = await pool.fetch(
            """
            SELECT id, name, number, year, type, sector, entidad, materia,
                   articulos, vigencia, is_vigente, description, source_url, source,
                   full_text
            FROM laws
            WHERE greatest(similarity(name, $1), similarity(coalesce(materia, ''), $1)) > 0.25
            ORDER BY similarity(name, $1) DESC
            LIMIT $2
            """,
            consulta,
            limite,
        )

    return {
        "consulta": consulta,
        "encontrado": bool(filas),
        "total_devuelto": len(filas),
        "resultados": [
            {
                "nombre": f["name"],
                "numero": f["number"],
                "anio": f["year"],
                "tipo": f["type"],
                "entidad": f["entidad"],
                "sector": f["sector"],
                "materia": _recortar(f["materia"], 300)["texto"],
                "numero_articulos": f["articulos"],
                "vigencia": f["vigencia"],
                "vigente": f["is_vigente"],
                "descripcion": f["description"],
                "url_oficial": f["source_url"],
                "fuente": f["source"],
                "tiene_texto_completo": bool(f["full_text"]),
            }
            for f in filas
        ],
    }


@server.tool(
    description=(
        "Detalle de una norma por numero y anio (Ley 599 de 2000, Decreto 1071 "
        "de 2015). IMPORTANTE: la base guarda articulos y vigencia, pero el texto "
        "integro de los articulos puede no estar cargado; el campo "
        "`articulos_disponibles_en_base` lo indica sin adornos."
    )
)
async def obtener_ley(numero: str, anio: Optional[int] = None) -> dict:
    pool = await db()
    numero = str(numero).strip()

    if anio:
        fila = await pool.fetchrow(
            "SELECT * FROM laws WHERE number = $1 AND year = $2 LIMIT 1", numero, anio
        )
    else:
        fila = await pool.fetchrow(
            "SELECT * FROM laws WHERE number = $1 ORDER BY year DESC LIMIT 1", numero
        )

    if not fila:
        return {
            "encontrado": False,
            "consultado": f"{numero} de {anio}" if anio else numero,
            "advertencia": "Esa norma no esta en la base. Verifica en la fuente "
            "oficial antes de citarla.",
        }

    articulos = await pool.fetch(
        "SELECT article_number, title, chapter FROM law_chunks "
        "WHERE law_id = $1 ORDER BY article_number LIMIT 50",
        fila["id"],
    )
    total_articulos_cargados = await pool.fetchval(
        "SELECT count(*) FROM law_chunks WHERE law_id = $1", fila["id"]
    )

    return {
        "encontrado": True,
        "nombre": fila["name"],
        "numero": fila["number"],
        "anio": fila["year"],
        "tipo": fila["type"],
        "subtipo": fila["subtipo"],
        "entidad": fila["entidad"],
        "sector": fila["sector"],
        "materia": _recortar(fila["materia"], 800)["texto"],
        "numero_articulos_segun_fuente": fila["articulos"],
        "vigencia": fila["vigencia"],
        "vigente": fila["is_vigente"],
        "fecha_efecto": fila["effective_date"].isoformat() if fila["effective_date"] else None,
        "descripcion": fila["description"],
        "url_oficial": fila["source_url"],
        "vigencia_confianza": fila["vigencia_confidence"] if "vigencia_confidence" in fila else "desconocida",
        "capturado_en": fila["captured_at"].isoformat() if fila["captured_at"] else None,
        "articulos_disponibles_en_base": total_articulos_cargados,
        "articulos": [
            {"numero": a["article_number"], "titulo": a["title"], "capitulo": a["chapter"]}
            for a in articulos
        ],
        "advertencia": None
        if total_articulos_cargados
        else (
            "La base tiene la ficha de la norma pero NO el texto de sus "
            "articulos. Para citar articulos debes consultar la fuente oficial "
            f"({fila['source_url']}) y no inventar su contenido."
        ),
    }


@server.tool(
    description=(
        "Busca el texto de un articulo concreto (Ley 599 de 2000, articulo 304). "
        "Devuelve `encontrado: false` si el articulo no esta cargado, en vez de "
        "inventarlo."
    )
)
async def obtener_articulo(numero_ley: str, articulo: str, anio: Optional[int] = None) -> dict:
    pool = await db()
    filas = await pool.fetch(
        """
        SELECT lc.article_number, lc.title, lc.chapter, lc.content,
               lc.is_vigente, l.name, l.number, l.year, l.source_url
        FROM law_chunks lc
        JOIN laws l ON l.id = lc.law_id
        WHERE lc.article_number = $1
          AND ($2 = '' OR l.number = $2)
          AND (coalesce($3, 0) = 0 OR l.year = $3::int)
        LIMIT 5
        """,
        str(articulo).strip(),
        str(numero_ley).strip() if numero_ley else "",
        anio,
    )

    if not filas:
        return {
            "encontrado": False,
            "consultado": f"articulo {articulo} de la Ley {numero_ley}"
            + (f" de {anio}" if anio else ""),
            "advertencia": (
                "El articulo no esta cargado en la base. La normativa se "
                "ingesto por ficha (numero, materia, vigencia) y no por texto. "
                "Consultalo en la fuente oficial y no redactes su contenido de "
                "memoria."
            ),
        }

    return {
        "encontrado": True,
        "resultados": [
            {
                "norma": f"{f['name']}",
                "numero": f["number"],
                "anio": f["year"],
                "articulo": f["article_number"],
                "titulo": f["title"],
                "capitulo": f["chapter"],
                "vigente": f["is_vigente"],
                "texto": f["content"],
                "url_oficial": f["source_url"],
            }
            for f in filas
        ],
    }


# ============================== PLANTILLAS =================================


@server.tool(
    description=(
        "Busca plantillas y minutas juridicas del catalogo (demandas, "
        "tutelas, oficios, contratos) por area y tipo de documento."
    )
)
async def buscar_plantillas(
    consulta: Optional[str] = None,
    area: Optional[str] = None,
    tipo_documento: Optional[str] = None,
    limite: int = 10,
) -> dict:
    limite = _limite(limite)
    pool = await db()

    cond: list = []
    params: list = []
    if consulta:
        params.append(consulta)
        cond.append(
            f"(name ILIKE '%' || ${len(params)} || '%' "
            f"OR description ILIKE '%' || ${len(params)} || '%' "
            f"OR tags::text ILIKE '%' || ${len(params)} || '%')"
        )
    if area:
        params.append(area)
        cond.append(f"legal_area = ${len(params)}")
    if tipo_documento:
        params.append(tipo_documento)
        cond.append(f"document_type = ${len(params)}")

    where = f"WHERE {' AND '.join(cond)}" if cond else ""
    params.append(limite)

    filas = await pool.fetch(
        f"""
        SELECT name, description, legal_area, subcategory, document_type,
               purpose, file_type, tags, jurisdiction, source_url, file_url,
               related_norms, related_jurisprudence
        FROM legal_templates
        {where}
        ORDER BY download_count DESC NULLS LAST
        LIMIT ${len(params)}
        """,
        *params,
    )

    return {
        "consulta": consulta,
        "encontrado": bool(filas),
        "total_devuelto": len(filas),
        "plantillas": [
            {
                "nombre": f["name"],
                "descripcion": f["description"],
                "area": f["legal_area"],
                "subcategoria": f["subcategory"],
                "tipo_documento": f["document_type"],
                "proposito": f["purpose"],
                "formato": f["file_type"],
                "etiquetas": f["tags"],
                "jurisdiccion": f["jurisdiction"],
                "url_plantilla": f["file_url"],
                "url_fuente": f["source_url"],
                "normas_relacionadas": f["related_norms"],
                "jurisprudencia_relacionada": f["related_jurisprudence"],
            }
            for f in filas
        ],
    }


# ============================== COBERTURA ==================================


@server.tool(
    description=(
        "Reporte de que hay realmente cargado. Usar esto ANTES de prometer que "
        "se puede responder algo: delimita con honestidad el alcance de la base."
    )
)
async def estadisticas() -> dict:
    pool = await db()

    fila = await pool.fetchrow(
        """
        SELECT
            (SELECT count(*) FROM rulings) AS total_sentencias,
            (SELECT count(*) FROM rulings
             WHERE full_text IS NOT NULL AND full_text != '') AS con_texto,
            (SELECT count(*) FROM rulings WHERE embedding_status = 'completed')
                AS con_embedding,
(SELECT count(*) FROM rulings
              WHERE jsonb_array_length(cited_rulings) > 0) AS con_citas,
            (SELECT count(*) FROM rulings
              WHERE jsonb_array_length(referenced_norms) > 0) AS con_normas,
            (SELECT count(*) FILTER (WHERE jsonb_array_length(themes) > 0) FROM rulings) AS con_temas,
            (SELECT count(*) FILTER (WHERE summary != '') FROM rulings) AS con_resumen,
            (SELECT count(*) FILTER (WHERE magistrate_ponent != '') FROM rulings) AS con_ponente,
            (SELECT count(*) FROM rulings WHERE full_text = '') AS sin_texto,
            (SELECT count(*) FROM rulings WHERE full_text IS NULL) AS texto_nulo,
            (SELECT count(*) FILTER (WHERE citation_canonical IS NOT NULL) FROM rulings) AS con_canonical,
            (SELECT min(ruling_date) FROM rulings) AS fecha_min,
            (SELECT max(ruling_date) FROM rulings) AS fecha_max,
            (SELECT max(updated_at) FROM rulings) AS rulings_updated,
            (SELECT max(last_sync_at) FROM rulings) AS rulings_sync,
            (SELECT count(DISTINCT process_type) FROM rulings) AS tipos_proceso,
            (SELECT count(DISTINCT magistrate_ponent) FROM rulings) AS ponentes,
            (SELECT count(*) FROM laws) AS total_normas,
            (SELECT count(*) FROM laws WHERE is_vigente) AS normas_vigentes,
            (SELECT count(*) FROM laws WHERE full_text IS NOT NULL AND full_text != '') AS normas_con_texto,
            (SELECT count(*) FROM laws WHERE full_text IS NULL OR full_text = '') AS normas_sin_texto,
            (SELECT count(*) FROM law_chunks) AS articulos_cargados,
            (SELECT max(captured_at) FROM laws) AS leyes_capturadas,
            (SELECT count(*) FROM legal_templates) AS plantillas
        """
    )

    procesos = await pool.fetch(
        "SELECT process_type, count(*) AS n FROM rulings GROUP BY process_type "
        "ORDER BY n DESC LIMIT 12"
    )

    return {
        "sentencias": {
            "total": fila["total_sentencias"],
            "con_texto_completo": fila["con_texto"],
            "sin_texto": fila["sin_texto"] or 0,
            "texto_nulo": fila["texto_nulo"] or 0,
            "con_embedding": fila["con_embedding"],
            "con_canonical": fila["con_canonical"],
            "con_temas": fila["con_temas"],
            "con_resumen": fila["con_resumen"],
            "con_ponente": fila["con_ponente"],
            "con_providencias_citadas": fila["con_citas"],
            "con_normas_citadas": fila["con_normas"],
            "cobertura_fechas": [
                fila["fecha_min"].isoformat() if fila["fecha_min"] else None,
                fila["fecha_max"].isoformat() if fila["fecha_max"] else None,
            ],
            "ultima_actualizacion": fila["rulings_updated"].isoformat() if fila["rulings_updated"] else None,
            "ultima_sincronizacion": fila["rulings_sync"].isoformat() if fila["rulings_sync"] else None,
            "tipos_proceso": {p["process_type"]: p["n"] for p in procesos},
            "ponentes_distintos": fila["ponentes"],
        },
        "normativa": {
            "fichas": fila["total_normas"],
            "vigentes": fila["normas_vigentes"],
            "con_texto_completo": fila["normas_con_texto"],
            "sin_texto_completo": fila["normas_sin_texto"],
            "articulos_con_texto": fila["articulos_cargados"],
            "capturado_en": fila["leyes_capturadas"].isoformat() if fila["leyes_capturadas"] else None,
        },
        "plantillas": fila["plantillas"],
        "alcance_real": {
            "corte_constitucional": "Completo desde 2017 en adelante.",
            "normativa_suin": "Fichas (numero, materia, vigencia). El texto de "
            "los articulos NO esta cargado: no se pueden citar articulos con "
            "su contenido.",
            "consejo_de_estado": "No cargado (no hay fuente publica estable).",
            "corte_suprema": "No cargado (no hay fuente publica estable).",
            "cndj": "No cargado (no hay fuente publica estable).",
        },
    }


def main() -> None:
    import argparse

    p = argparse.ArgumentParser(description="Servidor MCP de Legal AI")
    p.add_argument(
        "--transport",
        default="stdio",
        choices=["stdio", "sse", "streamable-http"],
        help="stdio para clientes locales de escritorio",
    )
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=8765)
    args = p.parse_args()

    if args.transport == "stdio":
        server.run(transport="stdio")
    else:
        server.run(transport=args.transport, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
