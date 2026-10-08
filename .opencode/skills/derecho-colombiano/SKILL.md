---
name: derecho-colombiano
description: Metodologia para analizar derecho en Colombia con la base de jurisprudencia de Legal AI. Use cuando la consulta incluya providencia, sentencia, tutela, demanda de inconstitucionalidad, norma, articulo, concepto juridico colombiano, o cuando pida criterio, antecedentes o analisis de un caso en territorio colombiano.
---

# Derecho colombiano con base de jurisprudencia real

## Que hay realmente en la base

Antes de prometer nada, ejecuta `estadisticas` de legal-ai. La cobertura real es:

| Fuente | Estado | Desde |
| --- | --- | --- |
| Corte Constitucional (T-, C-, SU-, A-) | Texto completo | 2017 en adelante |
| SUIN (fichas de leyes y decretos) | Solo ficha: numero, materia, vigencia | todo el histórico |
| Artículos de ley | **NO cargados** | — |
| Consejo de Estado / Corte Suprema / CNDJ | **No cargado** | — |

Consecuencia operativa, sin excepciones:

- Puedes citar providencias de la Corte Constitucional con cita, fecha, ponente y URL.
- **No puedes citar el texto de un artículo.** `obtener_articulo` devuelve
  `encontrado: false` y eso es lo que debes reportar. Nunca redactes el
  contenido de un artículo de memoria.
- Si el usuario necesita Consejo de Estado, Corte Suprema o CNDJ, dilo que no
  está en la base y ofrece buscar en la fuente oficial.

## Herramientas de legal-ai

| Herramienta | Úsala para |
| --- | --- |
| `buscar_sentencias` | Primer paso de casi todo. Conceptos, no radicados. Filtra por `proceso`, `desde`, `hasta`, `ponente`. |
| `obtener_sentencia` | Una providencia por cita. Acepta `T-760/08`, `T-760 de 2008`, `t 760 08`. |
| `fragmento_sentencia` | Seguir leyendo un texto recortado con `indice`. |
| `jurisprudencia_relacionada` | Qué sentencias cita una providencia y cuáles están disponibles. |
| `normas_referenciadas` | Normas que cita una providencia, o providencias que citan una norma. |
| `buscar_normas` | Fichas de leyes y decretos por nombre, número o materia. |
| `obtener_ley` | Ficha de una ley: vigencia, materia, número de artículos. |
| `obtener_articulo` | Texto de un artículo. **Suele devolver `encontrado: false`.** |
| `buscar_plantillas` | 432 plantillas y minutas por área. |
| `estadisticas` | Cobertura y límites reales. |

## Regla de oro: no inventar

Esta es la diferencia entre un abogado útil y uno peligroso.

1. **Toda providencia que menciones debe venir de una herramienta.** Si la
   recuerdas de memoria, está mal: búscala. Si no aparece, dilo que no está en
   la base.
2. **Cita siempre los cuatro datos**: `cita`, `fecha`, `ponente` (cuando exista)
   y `url_oficial`. Sin `url_oficial` no la presentes como verificada.
3. **`encontrado: false` es una respuesta válida.** Reporta la ausencia como
   un hallazgo: "no localicé esa providencia en la base, que cubre 2017 en
   adelante; puede ser anterior a esa fecha".
4. **Distingue lo que dice la sentencia de tu interpretación.** Cita entre
   comillas o parafrasea con claridad; no mezcles tu criterio con el del tribunal.
5. **No inventes artículos ni numerales.** Si necesitas el texto de la Ley 599
   de 2000 artículo 304, `obtener_ley` te da la URL oficial y tú le dices al
   usuario que la consulte.

## Cómo buscar bien

La búsqueda es full-text en español sobre `citation`, `radicado`, `temas`,
`resuelve`, `resumen` y `full_text`. Rendimiento alto con:

- **Conceptos jurídicos**, no frases largas: `"vulneración al debido proceso"`
  funciona mejor que `"cuando una persona es juzgada sin audiencia previa"`.
- **Varias búsquedas en vez de una amplia**: si no hay resultados, reformula
  con sinónimos jurídicos antes de concluir que no existe.
- Filtra por `proceso` cuando el usuario distinga tutela de inconstitucionalidad.
- Si buscas por número y no aparece, la providencia es anterior a 2017 o no
  existe. No es un fallo de la base.

Para seguir una línea doctrinal: `jurisprudencia_relacionada` sobre una
sentencia central. Devuelve `disponibles` (verificadas en la base) y
`no_disponibles` (citadas pero sin texto cargado): cita solo las primeras, y
menciona honestamente las otras como "citada por X, no consultable aquí".

## Estructura de una respuesta jurídica

1. **Respuesta directa** en las primeras dos líneas: qué se pregunta y qué se
   responde, con el grado de certeza real.
2. **Fundamento jurisprudencial**: providencias con cita, fecha, ponente y URL.
3. **Análisis**: por qué esas sentencias resuelven el problema planteado.
4. **Normativa**: con la advertencia de que el texto del artículo no está
   cargado, si es el caso.
5. **Límites y vacíos**: qué no pudo verificarse.
6. **Siguiente paso**: qué falta para una respuesta completa.

## Advertencia profesional

Esto es una herramienta de análisis, no una asesoría jurídica. En asuntos con
plazo, demora o consecuencia procesal, recomienda siempre un abogado
matriculado. No inventes plazos, ni términos, ni fuentes que no hayas leído.
