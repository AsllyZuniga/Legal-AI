-- =============================================================
-- 003_calidad.sql  —  Fase 1: exactitud de citas y trazabilidad
-- =============================================================
-- Aplicar con:  psql -v ON_ERROR_STOP=1 -f 003_calidad.sql
-- Revertir con:  psql -v ON_ERROR_STOP=1 -f 003_calidad_rollback.sql
--
-- Objetivos:
--   1. citation_canonical: identificador inequívoco (T-473-2017) con
--      índice único parcial. Toda búsqueda por cita debe usar esta
--      columna primero; el trigram queda solo como sugerencia.
--   2. Campos que hoy se pierden: problemas jurídicos, párrafos
--      numerados y el origen real del resumen.
--   3. Trazabilidad de la vigencia de las leyes: nunca como verdad
--      absoluta, siempre con fecha de captura y fuente.
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- 1. citation_canonical en rulings
-- -------------------------------------------------------------
-- Se genera sola, para que no pueda desincronizarse de `citation`.
-- Regla de siglo para años de 2 dígitos: > 91 => 19xx, si no 20xx.
-- Es la correcta para el rango real de la Corte, que arranca en 1991:
-- 92-99 son 1992-1999 y 00-26 son 2000-2026.

ALTER TABLE rulings
  ADD COLUMN IF NOT EXISTS citation_canonical text
  GENERATED ALWAYS AS (
    CASE
      WHEN citation !~ '^[A-Za-z]+-?[0-9]{1,5}[A-Za-z]?/[0-9]{2,4}$'
        THEN NULL
      ELSE upper(substring(citation from '^[A-Za-z]+'))
        || '-' || substring(citation from '[0-9]+')
        || coalesce(
             nullif(regexp_replace(
               citation,
               '^([A-Za-z]+)-?[0-9]+([A-Za-z])?/[0-9]+$',
               '\2', ''), ''),
             '')
        || '-' || CASE
             WHEN length(substring(citation from '[0-9]+$')) = 4
               THEN substring(citation from '[0-9]+$')
             ELSE (CASE WHEN substring(citation from '[0-9]+$')::int > 91
                        THEN '19' ELSE '20' END)
                  || substring(citation from '[0-9]+$')
           END
    END
  ) STORED;

-- Índices de lectura: equality sobre el canónico, y btree auxiliar
-- por tipo para el ponderado del ranking (Fase 1.3).
CREATE UNIQUE INDEX IF NOT EXISTS rulings_citation_canonical_uidx
  ON rulings (citation_canonical)
  WHERE citation_canonical IS NOT NULL;

CREATE INDEX IF NOT EXISTS rulings_type_date_idx
  ON rulings (ruling_type, ruling_date DESC);

-- -------------------------------------------------------------
-- 2. Contenido que hoy se descarta al parsear
-- -------------------------------------------------------------
ALTER TABLE rulings
  ADD COLUMN IF NOT EXISTS legal_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS numbered_paragraphs jsonb NOT NULL DEFAULT '[]'::jsonb;

-- El `summary` actual se arma con los considerandos, no con una
-- síntesis oficial de la Relatoría. Se deja constancia explícita
-- para que el agente nunca lo presente como ratio.
ALTER TABLE rulings
  ADD COLUMN IF NOT EXISTS summary_source text;

UPDATE rulings SET summary_source = 'considerandos_extraidos_html'
  WHERE summary IS NOT NULL AND summary <> '' AND summary_source IS NULL;

-- -------------------------------------------------------------
-- 3. Vigencia de leyes con fecha de captura y fuente
-- -------------------------------------------------------------
ALTER TABLE laws
  ADD COLUMN IF NOT EXISTS citation_canonical text
  GENERATED ALWAYS AS (
    CASE
      WHEN number IS NULL OR year IS NULL THEN NULL
      ELSE upper(coalesce(type, 'norma')) || ' ' || number || ' de ' || year
    END
  ) STORED,
  ADD COLUMN IF NOT EXISTS captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS vigencia_confidence text NOT NULL DEFAULT 'desconocida';

-- Fuente y fecha: la vigencia nunca se afirma como definitiva.
UPDATE laws
   SET captured_at = now(),
       vigencia_confidence = 'solo_ficha_sin_texto'
 WHERE captured_at IS NULL;

COMMENT ON COLUMN laws.vigencia IS
  'Texto de vigencia tal como lo publica SUIN. NO es una verificacion legal.';
COMMENT ON COLUMN laws.vigencia_confidence IS
  'Nivel de certeza sobre la vigencia: desconocida | solo_ficha_sin_texto | verificada_texto_completo';
COMMENT ON COLUMN rulings.summary_source IS
  'Origen del campo summary. NO es un ratio oficial de la Relatoria.';
COMMENT ON COLUMN rulings.legal_questions IS
  'Problemas juridicos extraidos del HTML. Vacio = no se pudo extraer, no = no los hay.';
COMMENT ON COLUMN rulings.numbered_paragraphs IS
  'Parrafos numerados si el HTML los trae, como [{n, texto}].';

COMMIT;