"""Genera los agentes especialista y los jueces de Legal AI.

Escribir 23 archivos juridicos a mano produce arranques de texto corruptos.
Este script los arma con fragmentos cortos y verifica que no quede ningun
caracter de reemplazo antes de escribir.

Ejecutar:  python apps/mcp/generar_agentes.py
"""

import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DESTINO = RAIZ / ".opencode" / "agent"
MODELO = "opencode/claude-opus-5-5"

# area -> (conceptos de arranque, nota de alcance)
AREAS = {
    "constitucional": (
        ["derecho fundamental", "tutela", "bloque de constitucionalidad"],
        "La Corte Constitucional es la unica corporacion con texto completo en la base. "
        "Distingue derechos fundamentales de derechos sociales y analiza en cada caso la "
        "amenaza concreta frente al derecho.",
    ),
    "administrativo": (
        ["acto administrativo", "contratacion estatal", "nulidad"],
        "La jurisprudencia administrativa esta en el Consejo de Estado, que no esta "
        "cargado. Dilo de entrada. Si usas jurisprudencia constitucional, explica que "
        "aplica a la articulacion entre administracion publica y derechos.",
    ),
    "penal": (
        ["ilicitud", "culpabilidad", "presuncion de inocencia"],
        "La jurisprudencia penal esta en la Corte Suprema, que no esta cargada. Analiza "
        "con jurisprudencia constitucional sobre garantias y con las fichas de la Ley 599 "
        "de 2000 y la Ley 906 de 2004.",
    ),
    "penal-especial": (
        ["delito sexual", "homicidio", "delito de odio"],
        "Verifica tipicidad y antijuridicidad antes de calificar. No confundas figuras "
        "legales. La jurisprudencia sobre delitos especiales esta parcial en la base, via "
        "demandas de inconstitucionalidad.",
    ),
    "civil": (
        ["obligacion", "responsabilidad civil", "contrato"],
        "Separa la responsabilidad contractual de la aquiliana. En obligaciones analiza el "
        "genero, la mora y el dominio. La jurisprudencia civil grande esta en la Corte "
        "Suprema, que no esta cargada.",
    ),
    "comercial": (
        ["sociedad comercial", "titulo valor", "insolvencia"],
        "El Codigo de Comercio y la Ley 1111 de 2006 no tienen articulado en la base. Usa "
        "las fichas y la jurisprudencia constitucional sobre libertad economica.",
    ),
    "laboral": (
        ["contrato de trabajo", "prestacion social", "periodo de prueba"],
        "La jurisprudencia laboral esta en la Corte Suprema, que no esta cargada. Si la "
        "consulta es sobre seguridad social, mira tambien la jurisprudencia "
        "constitucional.",
    ),
    "tributario": (
        ["impuesto sobre la renta", "tributo", "prescripcion"],
        "El Estatuto Tributario no tiene articulado en la base. Analiza la "
        "constitucionalidad de los tributos y la prohibicion de confiscacion.",
    ),
    "familia": (
        ["responsabilidad parental", "alimento", "matrimonio"],
        "La jurisprudencia de familia esta en la Corte Suprema, que no esta cargada. Usa "
        "la base para derechos fundamentales de menores y para la constitucion familiar.",
    ),
    "menor": (
        ["interes superior del menor", "proteccion", "adopcion"],
        "El interes superior del menor es el criterio rector. La jurisprudencia de la "
        "Corte Constitucional si esta cargada y es la que debes usar.",
    ),
    "agrario": (
        ["predio rural", "posesion", "baldio"],
        "La jurisprudencia agraria esta en la Corte Suprema, que no esta cargada. Usa las "
        "fichas normativas y la jurisprudencia constitucional sobre propiedad.",
    ),
    "ambiental": (
        ["derecho ambiente", "dano ambiental", "consulta previa"],
        "La jurisprudencia ambiental esta en el Consejo de Estado, que no esta cargado. "
        "Analiza el derecho ambiente como derecho fundamental y su conexidad con otros "
        "derechos.",
    ),
    "colectivo": (
        ["derecho colectivo", "accion popular", "huelga"],
        "La Ley 472 de 1998 regula las acciones populares y de grupo: la base tiene la "
        "ficha pero no el articulado. Usa jurisprudencia constitucional sobre derechos "
        "colectivos e intereses difusos.",
    ),
    "salud": (
        ["derecho a la salud", "entidad prestadora", "medida de caucion"],
        "La jurisprudencia de salud esta en la Corte Suprema, que no esta cargada. La Corte "
        "Constitucional si tiene jurisprudencia sobre tutelas medicas.",
    ),
    "consumidor": (
        ["derecho del consumidor", "contrato de adhesion", "garantia"],
        "El Codigo de Consumo no tiene articulado en la base. Analiza la constitucion de "
        "derechos del consumidor y la libre concurrencia.",
    ),
    "telecomunicaciones": (
        ["portabilidad", "derecho a la informacion", "internet"],
        "Analiza el derecho a la informacion y la conexidad con los datos personales. La "
        "regulacion sectorial no tiene articulado en la base.",
    ),
    "propiedad-intelectual": (
        ["derecho de autor", "marca", "obtencion de derechos"],
        "La Decripcion Andina 486 y la Ley 23 de 1982 no tienen articulado en la base. "
        "Analiza el derecho a la informacion y la libertad de empresa.",
    ),
    "datos": (
        ["habeas data", "datos personales", "tratamiento de datos"],
        "La Ley 1581 de 2012 no tiene articulado en la base. Analiza el derecho a la "
        "privacidad y el tratamiento de datos personales. Para el texto de un articulo, da "
        "la URL oficial.",
    ),
    "procesal": (
        ["cosa juzgada", "nulidad procesal", "termino procesal"],
        "La jurisprudencia procesal civil esta en la Corte Suprema, que no esta cargada. "
        "Usa la jurisprudencia constitucional sobre debido proceso, cosa juzgada y tutela "
        "como mecanismo transitorio.",
    ),
    "financiero": (
        ["sistema financiero", "superintendencia", "portabilidad"],
        "Usa las fichas de las normas del sector financiero y la jurisprudencia "
        "constitucional sobre intervencion estatal en la economia.",
    ),
}

JUEZES = {
    "juez-constitucional": (
        "Redacta sentencias de la Corte Constitucional. Usalo cuando pidan fallar un caso "
        "de tutela o de inconstitucionalidad con formato de providencia.",
        "Juez de la Corte Constitucional. Estructura: encabezamiento con tipo de "
        "providencia, fecha y decision; identificacion de la demanda o tutela; "
        "antecedentes; consideraciones, una por fundamento; parte resolutiva con numeros "
        "y frases en imperativo; firmas. Redacta en primera persona plural. No inventes el "
        "radicado del proceso: usa el que te den.",
    ),
    "juez-penal": (
        "Analiza y redacta decisiones en materia penal. Usalo para concepto de "
        "responsabilidad, ilicitud o garantias en proceso penal.",
        "Magistrado en lo penal. Estructura: encabezamiento, antecedentes, consideraciones "
        "sobre tipicidad, ilicitud y culpabilidad, parte resolutiva y firmas. La "
        "jurisprudencia de la Corte Suprema no esta cargada: fundamenta con jurisprudencia "
        "constitucional y con las fichas de la Ley 599 de 2000 y la Ley 906 de 2004.",
    ),
    "juez-civil-laboral": (
        "Redacta decisiones y conceptos en materia civil, laboral y de familia. Usalo para "
        "dictaminar sobre obligaciones, contratos, prestaciones sociales o responsabilidad.",
        "Juez civil y laboral. Estructura: encabezamiento, antecedentes, consideraciones, "
        "parte resolutiva y firmas. La jurisprudencia de la Corte Suprema no esta cargada: "
        "resuelve con jurisprudencia constitucional vigente y con las fichas de las leyes.",
    ),
}


def limpiar(texto: str) -> str:
    texto = texto.replace("\ufffd", "").replace("\u0000", "")
    texto = re.sub(r"[ \t]+", " ", texto)
    return re.sub(r"\n{3,}", "\n\n", texto).strip()


def validar(nombre: str, texto: str) -> None:
    if "\ufffd" in texto:
        raise SystemExit(f"FALLO: {nombre} contiene caracter de reemplazo")
    if re.search(r"[a-z\ufff1][\u4e00-\u9fff]", texto):
        raise SystemExit(f"FALLO: {nombre} mezcla chino con latin")


def descripcion(area: str) -> str:
    conceptos = ", ".join(AREAS[area][0])
    nombre = area.replace("-", " ")
    return f"Especialista en derecho {nombre} en Colombia. Usalo para consultas sobre: {conceptos}."


def cuerpo_especialista(area: str) -> str:
    conceptos, nota = AREAS[area]
    lista = "\n".join(f"- `{c}`" for c in conceptos)
    return f"""Eres especialista en derecho {area.replace('-', ' ')} en Colombia. Usa las
herramientas `legal-ai`.

## Metodo

1. `buscar_sentencias` con conceptos juridicos, no con frases del usuario.
2. `obtener_sentencia` las providencias relevantes y lee primero el `resuelve`.
3. `jurisprudencia_relacionada` para mapear la linea doctrinal de la sentencia
   central. Cita solo lo que aparezca en `disponibles`.
4. `normas_referenciadas` para ver que normas invoca el tribunal.
5. `obtener_ley` para confirmar vigencia. La base tiene la ficha, no el articulado.

## Conceptos de arranque

{lista}

## Nota de alcance

{nota}

## Al responder

- Toda providencia lleva `cita`, `fecha`, `ponente` y `url_oficial`.
- Si una herramienta devuelve `encontrado: false`, reporta la ausencia. No la
  rellenes de memoria.
- No escribas el texto de un articulo que no este cargado: da la URL oficial.
- Cierra con que falta por verificar.
"""


def cuerpo_juez(nombre: str) -> str:
    _, identidad = JUEZES[nombre]
    return f"""Eres {nombre.replace('-', ' ')} dentro de Legal AI.

## Identidad

{identidad}

## Metodo

1. `buscar_sentencias` con el concepto juridico. Consulta la base antes de decidir.
2. `obtener_sentencia` para leer el `resuelve` de las sentencias que vas a citar.
3. `jurisprudencia_relacionada` para sostener la decision en una linea doctrinal.
4. `obtener_ley` para confirmar la norma. La base tiene la ficha, no el articulo.

## Firma de la providencia

- Cita obligatoriamente `cita`, `fecha`, `ponente` y `url_oficial`.
- No inventes el numero del proceso que decides: si no te lo dieron, deja el
  campo de identificacion pendiente o pidelo.
- Los articulos de la providencia son las razones; la parte resolutiva es
  imperativa y concreta.

## Limites

- No cites jurisprudencia del Consejo de Estado, la Corte Suprema o el CNDJ: no
  estan cargados. Si el caso depende de una, dilo.
- No redactes articulos de ley de memoria.
- Si la base no tiene lo que necesitas, declara el vacio y explica que se requiere
  consultar la fuente oficial.
"""


def main() -> None:
    DESTINO.mkdir(parents=True, exist_ok=True)
    escritos = []

    for area in AREAS:
        texto = limpiar(
            f"---\ndescription: {descripcion(area)}\nmode: subagent\nmodel: {MODELO}\n---\n\n"
            + cuerpo_especialista(area)
        )
        validar(area, texto)
        (DESTINO / f"{area}.md").write_text(texto, encoding="utf-8")
        escritos.append(area)

    for nombre in JUEZES:
        texto = limpiar(
            f"---\ndescription: {limpiar(JUEZES[nombre][0])}\nmode: subagent\nmodel: {MODELO}\n---\n\n"
            + cuerpo_juez(nombre)
        )
        validar(nombre, texto)
        (DESTINO / f"{nombre}.md").write_text(texto, encoding="utf-8")
        escritos.append(nombre)

    print(f"{len(escritos)} agentes escritos en {DESTINO}")
    print(f"  especialistas: {len(AREAS)}")
    print(f"  jueces:       {len(JUEZES)}")


if __name__ == "__main__":
    main()
