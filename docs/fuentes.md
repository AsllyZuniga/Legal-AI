# Inventario de fuentes — Fase 0

Todo lo de este documento se verificó con peticiones reales. Comandos reproducibles al final.

Fecha de verificación: 2026-10-02.

## Resumen ejecutivo

Dos hallazgos cambian la estrategia respecto a lo asumido:

1. **El dataset de datos.gov.co de la Corte Constitucional arranca en 1992, no en 2017.** Tenemos el 18% de lo disponible. El límite de 2017 era decisión nuestra, no de la fuente.
2. **No existe fuente accesible con articulado de leyes.** SUIN sirve una SPA vacía. El articulado queda bloqueado hasta encontrar la URL nueva de Función Pública.

---

## a. datos.gov.co — Socrata SODA

| Campo | Valor |
|---|---|
| Base | `https://www.datos.gov.co/resource/{id}.json` |
| Catálogo | `https://api.us.socrata.com/api/catalog/v1?domains=www.datos.gov.co` |
| Tipo | API JSON (SODA 2.1) |
| Autenticación | Ninguna, datasets públicos |
| Límites | `robots.txt`: `Crawl-delay: 1` → el scraper usa 1,2 s y cumple |
| Términos de uso | Datos abiertos de Colombia (datos.gob.co), reutilización permitida |

### Dataset principal: `v2k4-2t8s`

"Sentencias proferidas por la Corte Constitucional"

- **29.474 registros**, **1992 → 2026**, sin un solo hueco anual.
- Tipos: `T` 21.241 · `C` 7.569 · `SU` 664.
- Columnas: `proceso, expediente_tipo, expediente_numero, magistrado_a, sala,
  sentencia_tipo, sentencia, fecha_sentencia, sv_spv, av_apv`.

**Límites duros:**

- **No hay columna de URL.** El metadato llega por API, pero el texto íntegro
  sigue necesitando scrape de `/relatoria/`.
- `sv_spv` y `av_apv` valen `"s.d."` en las 20.000 muestras revisadas.
  **No contienen salvamientos ni aclaraciones de voto.** No sirven para nada.

Otros datasets de la Corte (`ujr7-jwzm`, `fbtr-7k2r`, `2y49-6wik`) son
subconjuntos curados —solo órdenes a ministerios, solo exhortos al Congreso,
solo decretos de la pandemia—, no años adicionales.

### Consejo de Estado (parcial, con texto)

| Id | Nombre | Cobertura |
|---|---|---|
| `ukfp-srim` | Acciones Populares y de Grupo 1999-2019 — Sentencias | 1999-2019 |
| `evke-icdm` | Controles Inmediatos de Legalidad | parcial |
| `njuz-uxyd` | Acciones Populares y de Grupo 1999-2019 | 1999-2019 |
| `r6w4-eyn9` | Pérdidas de Investidura de Congresistas | 1991-2022 |

### prosecutors / otros

`procuraduria.gov.co` conceptos jurídicos: **0 resultados** en el catálogo.

### Trampa técnica documentada

`$where=sentencia = 'T-760/08'` **se ignora en silencio** y devuelve el inicio
del dataset. No hay error; hay datos falsos. Hay que usar `like` y escapar la
barra:

```
?$where=sentencia like 'T-760/08'   ->  1 resultado correcto
?$where=sentencia = 'T-760/08'       ->  devuelve 1992, filtro ignorado
```

---

## b. Relatoría Corte Constitucional

| Campo | Valor |
|---|---|
| Base | `https://www.corteconstitucional.gov.co/relatoria/{año}/{TIPO}-{NNN}-{AA}.htm` |
| Tipo | HTML |
| Autenticación | Ninguna |
| `robots.txt` | `Allow: /relatoria/` explícito. **Sin `Crawl-delay`** → se mantiene 1,2 s por prudencia |
| Enumeración | `GET /relatoria/{año}/` → **403**, no hay atajo por directorio |
| Límite | 1,2 s por petición (decisión propia, no impuesta por robots) |

### Cobertura real

El patrón funciona **más allá de 2017**. Descargas verificadas con éxito:

| Sentencia | Año | Tamaño |
|---|---|---|
| `T-760/08` | 2008 | 2.051 KB |
| `T-025/04` | 2004 | 892 KB |
| `C-355/06` | 2006 | 3.318 KB |
| `T-446/93` | 1993 | 59 KB |
| `C-083/95` | 1995 | 143 KB |
| `C-041/93` | 1993 | 46 KB |
| `T-700/16` | 2016 | 113 KB |

- Cobertura efectiva **~1993 → 2016**. En 1991 `T-001/91` no existe (8 KB sin
  marcadores deConsideraciones/RESUELVE).
- **Las SU no siguen el patrón**: `SU-123/08` devuelve 8 KB sin marcadores.
  Ruta sin descubrir.

### Rutas prohibidas por `robots.txt`

No se raspan: `/API/`, `/sentencias/`, `/constitucion/`, `/laconstitucion/`,
`/ses-t-760-08/`, `/assets/`, `/media/`, `/pqrs/`, `/saladeprensa/`,
`/sedeelectronicaFront/`, `/eventos/`, `/inicio/`.

**Consecuencia directa:** la Constitución no sale de la Corte. Hay que buscar
el articulado en otra fuente.

### Qué no existe

No se halló columna de **síntesis**, **ratio** ni **problemas jurídicos** en
ninguna fuente. Lo más cercano a un ratio publicado es el `RESUELVE` que ya
extraemos del HTML, y debe etiquetarse como tal, nunca como ratio oficial.

---

## c. Articulado de leyes — punto débil

| Fuente | Resultado | Veredicto |
|---|---|---|
| **SUIN-Juriscol** | Sin `robots.txt` real: devuelve la SPA Angular de Govco. `viewDocument.asp?ruta=Normas/599_2000` → HTTP 200 pero **4,6 KB de shell, cero articulado** | **Descartada.** Requiere navegador headless, fuera de alcance |
| **Función Pública** | Site vivo (238 KB). `robots.txt` con sitemap, sin `Disallow`. Pero `Normograma/Paginas/DetalleNormas.aspx?ID=600` → **404** | **Candidata principal.** Migró; falta hallar la URL nueva |
| Secretaría del Senado | Timeout en la verificación | No verificada |
| Diario Oficial / Imprenta Nacional | `imprentanacional.gov.co` no resuelve DNS | No disponible |

**Las 88.010 fichas SUIN no se pueden completar desde SUIN.** Sin una fuente
nueva de articulado, `obtener_articulo` seguirá devolviendo `encontrado:false`,
que es la conducta correcta pero deja la herramienta inservible.

---

## d. Otras jurisdicciones

| Fuente | `robots.txt` | API |
|---|---|---|
| Corte Suprema | Real. Permite todo salvo `/wp-admin/`. Sin crawl-delay | **WordPress, `wp-json` → 401.** API deshabilitada, solo HTML |
| CNDJ | `Disallow:` vacío = permite todo | `wp-json` no responde |
| Consejo de Estado | `relatoriacontencioso.gov.co` **no resuelve DNS** | Dominio por redescubrir |

---

## Tabla priorizada

| # | Acción | Valor jurídico | Esfuerzo | Riesgo |
|---|---|---|---|---|
| 1 | Completar Corte Constitucional vía datos.gov.co (1992-2016) | Muy alto | Bajo | Muy bajo |
| 2 | Texto pre-2017 desde `/relatoria/` (~20.000) | Muy alto | **~7 h** (1,2 s c/u) | Medio |
| 3 | `citation_canonical` + coincidencia exacta | Alto | Bajo | Nulo |
| 4 | Articulado desde Función Pública | Crítico | Medio | Bajo |
| 5 | Sentencias de Consejo de Estado vía Socrata | Medio-alto | Medio | Bajo |
| 6 | Las 664 sentencias SU | Alto | Bajo | Bajo |
| 7 | Descubrir ruta de SU en `/relatoria/` | Medio | Bajo | Bajo |

Orden aprobado por el usuario: **Fase 1 (calidad) antes que Fase 2 (cobertura)**,
y arrancar el scrapeo pre-2017 por las providencias ya citadas
(las que hoy el grafo marca como no consultables) en vez de las ~20.000.

---

## Reproducir

```powershell
# robots.txt
Invoke-WebRequest "https://www.corteconstitucional.gov.co/robots.txt" -UseBasicParsing

# cobertura anual del dataset
$sel = [uri]::EscapeDataString("date_extract_y(fecha_sentencia) AS anio, count(1) AS n")
Invoke-RestMethod "https://www.datos.gov.co/resource/v2k4-2t8s.json?`$select=$sel&`$group=anio&`$order=anio"

# texto pre-2017 permitido
Invoke-WebRequest "https://www.corteconstitucional.gov.co/relatoria/2008/T-760-08.htm" -UseBasicParsing

# confirmar que SUIN no sirve articulado
Invoke-WebRequest "https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Normas/599_2000" -UseBasicParsing
```