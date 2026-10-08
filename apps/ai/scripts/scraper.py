import asyncio
import asyncpg
import httpx
import json
import os
import re
import time
import uuid
from datetime import datetime
from bs4 import BeautifulSoup

DB_URL = os.getenv("DATABASE_URL", "postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai")
DATOS_API = "https://www.datos.gov.co/resource/v2k4-2t8s.json"
RELATORIA_BASE = "https://www.corteconstitucional.gov.co/relatoria"

# Ritmo contra la relatoria de la Corte Constitucional. El sitio no publica
# limites formales, pero por encima de ~1.5 peticiones por segundo corta la
# conexion y termina bloqueando la IP: a 0.35 s se perdia la mitad del recorrido.
RATE_LIMIT = float(os.getenv("SCRAPER_RATE_LIMIT", "1.6"))

# Cortes de seguridad para poder correr lotes acotados sin tocar el codigo.
# 0 = sin limite.
MAX_METADATA = int(os.getenv("SCRAPER_MAX_METADATA", "0"))
MAX_HTML_FETCH = int(os.getenv("SCRAPER_MAX_HTML", "0"))
SINCE_DATE = os.getenv("SCRAPER_SINCE", "2017-01-01")

# Tolerancia a fallos: tras N descargas seguidas que devuelven vacio, la corrida
# se detiene para no insistir contra un sitio que ya nos rechazo.
MAX_FALLOS_SEGUIDOS = int(os.getenv("SCRAPER_MAX_FALLOS", "8"))
MAX_RETRIES = int(os.getenv("SCRAPER_MAX_RETRIES", "3"))
RETRY_BASE_WAIT = float(os.getenv("SCRAPER_RETRY_WAIT", "5"))

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

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

# Cita de providencia en formato Colombia.
#   T-760/08, C-041/17, SU-144/09, A-005/12   (dos digitos de ano)
#   T-760 de 2008                              (ano completo)
#   SC-12345-16                                 (CSJ: numero completo, guion)
# El orden de las alternativas importa: "SU" y "SC" deben probarse antes que "S",
# porque \b tras "S" iguala en "SU" y "SC".
RE_CITACION = re.compile(
    r'\b(?:(SU|SC|[TC]|A)[- ]?(\d{1,5})\s*(?:/|de)\s*(\d{2,4})'
    r'|SC[- ](\d{4,6})-(\d{2,4}))\b',
    re.IGNORECASE,
)

# "Sentencia T-760 de 2008", "Sentencias C-041/17 y T-233/18", "Auto A-005 de 2012"
RE_CITA_POR_NOMBRE = re.compile(
    r'\b(?:Sentencias?|Autos?|Providencias?)\s+((?:(?:SU|SC|[TC]|A)[- ]?\d{1,5}\s*(?:/|de)\s*\d{2,4}'
    r'|SC[- ]\d{4,6}-\d{2,4})'
    r'(?:\s*(?:,|y|and)\s*(?:(?:SU|SC|[TC]|A)[- ]?\d{1,5}\s*(?:/|de)\s*\d{2,4}'
    r'|SC[- ]\d{4,6}-\d{2,4}))*)',
    re.IGNORECASE,
)

# "(MP. Luis Ernesto Vargas Silva)" o "(M.P.)" / "Mag. Ponente"
RE_PONENTE = re.compile(
    r'\(?\s*M\.?\s*P\.?\s*[:.]?\s*'
    r'([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,4})\s*\)?'
)

# Ley 599 de 2000, artículo 304, Decreto 1071 de 2015
RE_NORMA = re.compile(
    r'\b(Ley|Decreto|Resolución|Circular|Acto Legislativo)\s+(\d{1,6})\s*(?:de|/)\s*(\d{4})',
    re.IGNORECASE,
)
RE_ARTICULO = re.compile(r'\b(?:art[íi]culos?|art)\.?\s*(\d{1,3}(?:\s*(?:,|y|-|a)\s*\d{1,3})*)', re.IGNORECASE)


def normalizar_cita(tipo: str, numero: str, anio: str) -> str:
    """Lleva cualquier forma hallada a la convencion del proyecto.

    Convencion de salida: T-760/08, C-041/17, SC-12345-16, A-005/12.
    Las providencias de la CSJ (SC) conservan el numero completo con guion.
    """
    tipo = tipo.upper()
    numero = str(numero).strip()
    anio = anio.strip()

    if len(anio) == 4:
        return f"{tipo}-{numero}/{anio[2:]}"

    # Anio de dos digitos: no se puede expandir sin ambiguidad (p. ej. 97 -> 1997).
    return f"{tipo}-{numero}/{anio}"


def cita_de_coincidencia(sub) -> str:
    """Normaliza un grupo de RE_CITACION, incluidos los formatos de la CSJ."""
    if sub.group(4):
        # SC-12345-16: numero completo con guion.
        return f"SC-{sub.group(4)}-{sub.group(5)}"
    return normalizar_cita(sub.group(1), sub.group(2), sub.group(3))


def extraer_citas(texto: str) -> list:
    """Todas las providencias citadas en un texto, normalizadas y sin repetir.

    Las providencias de la Corte Constitucional citan otras sentencias tanto en
    el cuerpo de los considerandos como en las notas al pie; ambas se capturan
    porque ambas son jurisprudencia valuable.
    """
    encontradas = {}

    for coincidencia in RE_CITA_POR_NOMBRE.finditer(texto):
        fragmento = coincidencia.group(1)
        for sub in RE_CITACION.finditer(fragmento):
            encontradas.setdefault(cita_de_coincidencia(sub), sub.start())

    # Citas sueltas del tipo "T-760 de 2008" sin la palabra "Sentencia".
    for sub in RE_CITACION.finditer(texto):
        cita = cita_de_coincidencia(sub)
        # Descarta falsos positivos como rangos de articulos o fechas.
        if cita not in encontradas and RE_NORMA.search(texto[max(0, sub.start() - 12):sub.start()]):
            continue
        encontradas.setdefault(cita, sub.start())

    return [cita for cita, _ in sorted(encontradas.items(), key=lambda kv: kv[1])]


def extraer_normas(texto: str) -> list:
    """Normas citadas con su identificacion completa."""
    normas = {}
    for coincidencia in RE_NORMA.finditer(texto):
        tipo, numero, anio = coincidencia.groups()
        clave = f"{tipo.capitalize()} {numero} de {anio}"
        normas.setdefault(clave, coincidencia.start())
    return [n for n, _ in sorted(normas.items(), key=lambda kv: kv[1])]


def extraer_ponente(texto: str) -> str:
    """Ultimo '(MP. X)' del texto: en la relatoria corresponde al titular."""
    found = RE_PONENTE.findall(texto)
    return found[-1].strip() if found else ""


def limpiar_espacios(valor: str) -> str:
    return re.sub(r'\s+', ' ', valor).strip(' .,;:')


def parse_html_to_text(html: str) -> dict:
    result = {
        "full_text": "",
        "summary": "",
        "resuelve": "",
        "themes": [],
        "cited_rulings": [],
        "referenced_norms": [],
        "ponente": "",
    }
    try:
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "head"]):
            tag.decompose()

        text = soup.get_text(separator="\n", strip=True)
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        result["full_text"] = text.strip()

        # El cuerpo de la providencia termina donde empiezan las notas al pie.
        cuerpo = text.split("\nNOTAS")[0] if "\nNOTAS" in text else text
        for marcador in ("1. ", "NOTAS", "[1]"):
            if cuerpo is text and len(cuerpo) > 4000:
                corte = cuerpo.find("\nNOTAS")
                if corte == -1:
                    corte = cuerpo.find("\n1. ")
                if corte > 2000:
                    cuerpo = cuerpo[:corte]

        result["cited_rulings"] = extraer_citas(text)
        result["referenced_norms"] = extraer_normas(cuerpo)[:40]
        result["ponente"] = extraer_ponente(text)

        lines = text.split("\n")
        capturando_resuelve = False
        temas_lines = []
        resuelve_lines = []

        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue
            mayuscula = line_clean.upper()

            if mayuscula in ("RESUELVE", "RESOLUCIÓN", "RESOLUCION") or mayuscula.startswith("R E S U E L V E"):
                capturando_resuelve = True
                temas_lines = []
                continue

            if capturando_resuelve:
                # La firma de los magistrados cierra la parte resolutiva.
                if re.match(r'^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\.]{10,}$', line_clean):
                    if resuelve_lines:
                        break
                resuelve_lines.append(line_clean)
            else:
                # Los temas de la relatoria vienen en versalitas tras la ficha.
                if len(line_clean) > 8 and line_clean == line_clean.upper() and re.search(r'[A-ZÁÉÍÓÚÑ]{4}', line_clean):
                    temas_lines.append(line_clean)

        if temas_lines:
            temas_text = " ".join(temas_lines[:24])
            temas_clean = re.findall(r'[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\-\.]{5,}', temas_text)
            vistos = set()
            temas = []
            for tema in temas_clean:
                tema = limpiar_espacios(tema)
                if len(tema) > 5 and tema not in vistos:
                    vistos.add(tema)
                    temas.append(tema)
            result["themes"] = temas[:15]

        if resuelve_lines:
            resuelve = "\n".join(resuelve_lines[:80]).strip()
            # Un RESUELVE util no es mas largo que la providencia completa.
            if len(resuelve) < len(text) * 0.9:
                result["resuelve"] = resuelve

        if len(text) > 200:
            # El resumen toma los considerandos, no la ficha ni las firmas.
            considerandos = re.findall(
                r'\n(\d{1,2})\.\s+((?:[^\n]|\n(?!\d{1,2}\.\s)){80,900})', cuerpo
            )
            if considerandos:
                resumen = " ".join(
                    limpiar_espacios(texto_parrafo) for _, texto_parrafo in considerandos[:3]
                )
                result["summary"] = resumen[:900]
            else:
                candidates = [
                    l.strip() for l in lines
                    if 50 < len(l.strip()) < 500 and not l.strip().startswith("Sentencia")
                ]
                if candidates:
                    result["summary"] = " ".join(candidates[:3])[:900]

    except Exception as e:
        print(f"  [ERROR] Parse error: {e}")
    return result

async def fetch_metadata(client: httpx.AsyncClient, offset: int = 0, limit: int = 1000) -> list:
    params = {
        "$where": f"fecha_sentencia>='{SINCE_DATE}'",
        "$order": "fecha_sentencia ASC",
        "$offset": str(offset),
        "$limit": str(limit),
    }
    try:
        resp = await client.get(DATOS_API, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  [ERROR] Fetch metadata offset={offset}: {e}")
        return []

async def fetch_relatoria_html(client: httpx.AsyncClient, url: str) -> str:
    """Descarga la providencia con reintentos y espera creciente.

    El sitio de la Corte Constitucional corta la conexion cuando se le pide
    demasiado. Ante eso conviene parar (ver MAX_FALLOS_SEGUIDOS) y volver mas
    tarde en vez de insistir.

    Devuelve (texto, estado). El estado distingue tres cosas que antes se
    confundian en un unico "":

    - "ok":       la providencia se descargo y tiene los marcadores esperadas.
    - "ausente":  la pagina responde 200 pero no contiene la providencia. Hay
                  rulings que sencillamente no estan publicados en la relatoria;
                  no es un rechazo del sitio y no debe abortar la corrida.
    - "rechazo":  error de red o HTTP 403/429/503. Si se repite, nos banearon.
    """
    if not url:
        return "", "ausente"

    espera = RETRY_BASE_WAIT
    for intento in range(1, MAX_RETRIES + 1):
        try:
            resp = await client.get(
                url,
                timeout=45,
                headers={"User-Agent": USER_AGENT, "Accept": "text/html,*/*"},
                follow_redirects=True,
            )
            if resp.status_code == 200:
                text = resp.content.decode("windows-1252", errors="replace")
                if any(m in text for m in ("Sentencia", "RESUELVE", "CONSIDERACIONES")):
                    return text, "ok"
                return "", "ausente"
            if resp.status_code in (403, 429, 503):
                print(f"  [WARN] HTTP {resp.status_code} en {url}, "
                      f"intento {intento}/{MAX_RETRIES}")
                await asyncio.sleep(espera)
                espera = min(espera * 2, 60)
                continue
            return "", "ausente"
        except Exception as e:
            print(f"  [ERROR] Fetch {url} (intento {intento}/{MAX_RETRIES}): "
                  f"{type(e).__name__}")
            await asyncio.sleep(espera)
            espera = min(espera * 2, 60)
    return "", "rechazo"

async def upsert_ruling(pool: asyncpg.Pool, data: dict):
    try:
        await pool.execute("""
            INSERT INTO rulings (
                id, citation, ruling_type, process_type, corporation,
                chamber, magistrate_ponent, ruling_date, legal_area,
                themes, summary, full_text, resuelve, source_url,
                source_type, radicado, referenced_norms, cited_rulings,
                embedding_status, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, NOW(), NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                full_text = COALESCE(NULLIF($12, ''), rulings.full_text),
                summary = COALESCE(NULLIF($11, ''), rulings.summary),
                resuelve = COALESCE(NULLIF($13, ''), rulings.resuelve),
                themes = CASE WHEN rulings.themes = '[]'::jsonb THEN $10 ELSE rulings.themes END,
                source_url = COALESCE(NULLIF($14, ''), rulings.source_url),
                referenced_norms = CASE
                    WHEN rulings.referenced_norms = '[]'::jsonb THEN $17
                    ELSE rulings.referenced_norms
                END,
                cited_rulings = CASE
                    WHEN rulings.cited_rulings = '[]'::jsonb THEN $18
                    ELSE rulings.cited_rulings
                END,
                updated_at = NOW()
        """,
            data["id"], data["citation"], data["ruling_type"], data["process_type"],
            data["corporation"], data["chamber"], data["magistrate_ponent"],
            data["ruling_date"], data["legal_area"],
            json.dumps(data["themes"]), data["summary"], data["full_text"],
            data["resuelve"], data["source_url"],
            data["source_type"], data["radicado"],
            json.dumps(data["referenced_norms"]), json.dumps(data["cited_rulings"]),
            data["embedding_status"]
        )
    except Exception as e:
        print(f"  [ERROR] Upsert {data.get('citation', '?')}: {e}")

async def main():
    print("=" * 60)
    print("SCRAPER: Corte Constitucional 2017-2026")
    print("=" * 60)

    pool = await asyncpg.create_pool(DB_URL, min_size=2, max_size=5)
    print("[OK] DB pool created")

    async with httpx.AsyncClient() as client:
        print("[1/3] Fetching metadata from datos.gov.co...")
        all_rulings = []
        offset = 0
        while True:
            batch = await fetch_metadata(client, offset=offset, limit=1000)
            if not batch:
                break
            all_rulings.extend(batch)
            print(f"  Fetched {len(all_rulings)} rulings so far...")
            if len(batch) < 1000:
                break
            if MAX_METADATA and len(all_rulings) >= MAX_METADATA:
                all_rulings = all_rulings[:MAX_METADATA]
                print(f"  Corte de metadata alcanzado: {MAX_METADATA}")
                break
            offset += 1000

        print(f"  Total metadata: {len(all_rulings)} rulings")

        existing = await pool.fetch(
            "SELECT citation, full_text FROM rulings WHERE corporation = 'corte_constitucional'"
        )
        existing_citations = {r["citation"] for r in existing}
        # Las que existen pero quedaron sin texto (por un corte de conexion o un
        # bloqueo del sitio) deben volver a la cola: si no, nunca se completan.
        sin_texto = {
            r["citation"] for r in existing if not r["full_text"]
        }
        print(f"  Existing in DB: {len(existing_citations)} (de los cuales {len(sin_texto)} sin texto)")

        to_process = []
        for r in all_rulings:
            sentencia = r.get("sentencia", "")
            fecha = r.get("fecha_sentencia", "")
            if not sentencia:
                continue
            url = build_relatoria_url(sentencia, fecha)
            to_process.append({
                "sentencia": sentencia,
                "fecha": fecha,
                "url": url,
                "exists": sentencia in existing_citations,
                "magistrado": r.get("magistrado_a", ""),
                "radicado": r.get("expediente_numero", ""),
                "proceso": r.get("proceso", ""),
            })

        # Se reprocesa lo que falta, incluidos los registros ya insertados que
        # quedaron sin texto en una corrida anterior.
        needs_text = [r for r in to_process if r["sentencia"] in sin_texto or not r["exists"]]
        already_exists = [r for r in to_process if r["exists"] and r["sentencia"] not in sin_texto]
        if MAX_HTML_FETCH:
            needs_text = needs_text[:MAX_HTML_FETCH]
        print(f"  New to insert: {len(needs_text)}")
        print(f"  Already exists: {len(already_exists)}")

        print("\n[2/3] Processing new rulings...")
        processed = 0
        errors = 0
        fallos_seguidos = 0
        ausentes = 0
        for i, ruling in enumerate(needs_text):
            sentencia = ruling["sentencia"]
            url = ruling["url"]
            fecha = ruling["fecha"]

            # Si el sitio corta la conexion de forma sostenida, se abandona la
            # corrida: reintentar en caliente solo alarga el bloqueo.
            if fallos_seguidos >= MAX_FALLOS_SEGUIDOS:
                print(f"\n  [ABORT] {MAX_FALLOS_SEGUIDOS} fallos seguidos. "
                      f"El sitio esta rechazando las peticiones; reanuda mas tarde.")
                break

            ruling_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"corte-{sentencia}"))

            process_type = "Tutela" if sentencia.startswith("T-") else \
                           "Demanda de inconstitucionalidad" if sentencia.startswith("C-") else \
                           "Decreto Legislativo" if sentencia.startswith("D-") else \
                           "Otro"

            tipo = "sentencia" if sentencia.startswith(("T-", "C-", "SU-")) else "auto"

            chamber = ""
            if sentencia.startswith("T-"):
                chamber = "Sala de Revisión"
            elif sentencia.startswith("C-"):
                chamber = "Sala Plena"
            elif sentencia.startswith("SU-"):
                chamber = "Sala Plena"

            ruling_date = None
            if fecha:
                try:
                    ruling_date = datetime.fromisoformat(fecha.replace("T", " ").replace("Z", ""))
                except:
                    pass

            html = ""
            if url:
                html, estado = await fetch_relatoria_html(client, url)
                await asyncio.sleep(RATE_LIMIT)

                # Solo el rechazo sostenido indica bloqueo. Una providencia que
                # no esta publicada ("ausente") es normal y no debe abortar.
                if estado == "ok":
                    fallos_seguidos = 0
                elif estado == "rechazo":
                    fallos_seguidos += 1
                    if fallos_seguidos in (1, 3, 5):
                        print(f"  [WARN] rechazo en {sentencia} "
                              f"({fallos_seguidos} seguidos)")
                else:
                    ausentes += 1
            else:
                fallos_seguidos = 0

            parsed = parse_html_to_text(html) if html else {}

            # La ficha de datos.gov.co ya trae el ponente; el HTML solo confirma.
            ponente = ruling.get("magistrado") or parsed.get("ponente", "")

            data = {
                "id": ruling_id,
                "citation": sentencia,
                "ruling_type": tipo,
                "process_type": ruling.get("proceso", process_type),
                "corporation": "corte_constitucional",
                "chamber": chamber,
                "magistrate_ponent": ponente,
                "ruling_date": ruling_date,
                "legal_area": "constitucional",
                "themes": parsed.get("themes", []),
                "summary": parsed.get("summary", ""),
                "full_text": parsed.get("full_text", ""),
                "resuelve": parsed.get("resuelve", ""),
                "source_url": url,
                "source_type": "official",
                "radicado": ruling.get("radicado", ""),
                "referenced_norms": parsed.get("referenced_norms", []),
                # La cabecera repite la propia cita: se filtra para no guardar
                # la providencia como citante de si misma.
                "cited_rulings": [
                    c for c in parsed.get("cited_rulings", [])
                    if c.lower() != sentencia.lower()
                ],
                "embedding_status": "pending",
            }

            await upsert_ruling(pool, data)
            processed += 1

            has_text = "YES" if parsed.get("full_text") else "NO"
            if processed % 10 == 0 or processed == 1:
                print(f"  [{processed}/{len(needs_text)}] {sentencia} - text: {has_text} - {url}")

        print(f"\n  Processed: {processed} rulings ({ausentes} no publicadas en la "
              f"relatoria, {fallos_seguidos} rechazos del sitio al final)")

    await pool.close()

    total = await asyncpg.create_pool(DB_URL, min_size=1, max_size=1)
    count = await total.fetchval("SELECT COUNT(*) FROM rulings WHERE corporation = 'corte_constitucional'")
    with_text = await total.fetchval("SELECT COUNT(*) FROM rulings WHERE corporation = 'corte_constitucional' AND full_text IS NOT NULL AND full_text != ''")
    await total.close()

    print("\n" + "=" * 60)
    print(f"RESULTADO FINAL:")
    print(f"  Total sentencias CC: {count}")
    print(f"  Con texto completo: {with_text}")
    print(f"  Sin texto: {count - with_text}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
