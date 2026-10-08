-- ============================================================================
-- 002_search.sql
-- Infraestructura de busqueda: busqueda textual en espanol, trigramas
-- y vectores semanticos (pgvector) sobre sentencias y normas.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensiones
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector  WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

-- ---------------------------------------------------------------------------
-- Embeddings: columnas que faltaban en el esquema
--   dimension 1024 = intfloat/multilingual-e5-large (local, sin API key)
-- ---------------------------------------------------------------------------
ALTER TABLE ruling_chunks ADD COLUMN IF NOT EXISTS embedding vector(1024);
ALTER TABLE law_chunks    ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- ---------------------------------------------------------------------------
-- Vector de busqueda textual (Postgres full-text, stemming en espanol)
-- Nota: generated columns no admiten funciones inmutables como unaccent,
-- por eso el texto se acumula sin normalizar; unaccent se aplica en la query.
-- ---------------------------------------------------------------------------
ALTER TABLE rulings ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(citation, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(radicado, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(themes::text, ' ')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(resuelve, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(summary, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(full_text, '')), 'D')
  ) STORED;

ALTER TABLE laws ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(materia, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(description, '')), 'C')
  ) STORED;

-- ---------------------------------------------------------------------------
-- Indices de busqueda textual
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS rulings_search_vector_idx ON rulings USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS laws_search_vector_idx    ON laws    USING GIN (search_vector);

-- Trigramas: toleran typos y busquedas parciales (radicados, citas)
CREATE INDEX IF NOT EXISTS rulings_citation_trgm_idx ON rulings USING GIN (citation    gin_trgm_ops);
CREATE INDEX IF NOT EXISTS rulings_radicado_trgm_idx ON rulings USING GIN (radicado    gin_trgm_ops);
CREATE INDEX IF NOT EXISTS rulings_resuelve_trgm_idx ON rulings USING GIN (resuelve    gin_trgm_ops);
CREATE INDEX IF NOT EXISTS rulings_ponente_trgm_idx  ON rulings USING GIN (magistrate_ponent gin_trgm_ops);

CREATE INDEX IF NOT EXISTS laws_name_trgm_idx   ON laws USING GIN (name        gin_trgm_ops);
CREATE INDEX IF NOT EXISTS laws_materia_trgm_idx ON laws USING GIN (materia     gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Indices vectoriales (HNSW: busqueda aproximada, escala a cientos de miles
-- de chunks sin penalizar la base)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS ruling_chunks_embedding_idx
  ON ruling_chunks USING HNSW (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS law_chunks_embedding_idx
  ON law_chunks USING HNSW (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Indices de filtrado frecuente en consultas juridicas
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS rulings_citation_lower_idx  ON rulings (lower(citation));
CREATE INDEX IF NOT EXISTS rulings_radicado_lower_idx  ON rulings (lower(radicado));
CREATE INDEX IF NOT EXISTS rulings_source_area_idx     ON rulings (source, legal_area);
CREATE INDEX IF NOT EXISTS rulings_magistrate_lower_idx ON rulings (lower(magistrate_ponent));
CREATE INDEX IF NOT EXISTS rulings_text_present_idx    ON rulings (id)
  WHERE full_text IS NOT NULL AND full_text <> '';

-- ---------------------------------------------------------------------------
-- Indices de consulta sobre normas: vigencia, tipo y ano
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS laws_type_vigente_idx ON laws (type, is_vigente);
CREATE INDEX IF NOT EXISTS laws_year_idx         ON laws (year DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS laws_source_idx       ON laws (source);
