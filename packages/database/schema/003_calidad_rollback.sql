-- =============================================================
-- 003_calidad_rollback.sql  —  reversa exacta de 003_calidad.sql
-- =============================================================
-- ADVERTENCIA: se pierde citation_canonical (se regenera sola al
-- re-aplicar la migración) y los campos de Fase 1.2-1.4.
-- Los textos, citas y grafos de `rulings` NO se tocan.
-- =============================================================

BEGIN;

DROP INDEX IF EXISTS rulings_type_date_idx;
DROP INDEX IF EXISTS rulings_citation_canonical_uidx;

ALTER TABLE rulings
  DROP COLUMN IF EXISTS numbered_paragraphs,
  DROP COLUMN IF EXISTS legal_questions,
  DROP COLUMN IF EXISTS summary_source,
  DROP COLUMN IF EXISTS citation_canonical;

ALTER TABLE laws
  DROP COLUMN IF EXISTS vigencia_confidence,
  DROP COLUMN IF EXISTS captured_at,
  DROP COLUMN IF EXISTS citation_canonical;

COMMIT;