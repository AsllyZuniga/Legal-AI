--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15 (Debian 16.15-1.pgdg12+2)
-- Dumped by pg_dump version 16.15 (Debian 16.15-1.pgdg12+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analysis_conclusions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis_conclusions (
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    conclusion_type text NOT NULL,
    content text NOT NULL,
    supporting_sources jsonb DEFAULT '[]'::jsonb NOT NULL,
    confidence_level numeric(3,2),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: analysis_findings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis_findings (
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    finding_type text NOT NULL,
    description text NOT NULL,
    severity text DEFAULT 'medium'::text NOT NULL,
    related_ruling_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    related_norm_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: analysis_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis_sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    case_id uuid,
    analysis_type text NOT NULL,
    input_data jsonb,
    output_data jsonb,
    confidence_score numeric(3,2),
    llm_model text,
    tokens_used integer,
    processing_time_ms integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: analysis_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis_sources (
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    source_type text NOT NULL,
    source_id uuid NOT NULL,
    relevance_score numeric(3,2),
    snippet text,
    used_in_conclusion boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    user_id uuid,
    action text NOT NULL,
    resource_type text,
    resource_id text,
    ip_address text,
    user_agent text,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: case_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_alerts (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    alert_type text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    recommendation text,
    related_fact_id uuid,
    related_ruling_id uuid,
    is_acknowledged boolean DEFAULT false NOT NULL,
    acknowledged_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: case_defenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_defenses (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    defense_type text,
    description text NOT NULL,
    legal_basis text,
    strength text DEFAULT 'medium'::text NOT NULL,
    source_ruling_id uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: case_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_events (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    fact_id uuid,
    description text NOT NULL,
    event_date timestamp(3) without time zone NOT NULL,
    is_date_exact boolean DEFAULT true NOT NULL,
    chronological_order integer,
    is_juridically_relevant boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: case_evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_evidence (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    evidence_type text NOT NULL,
    title text NOT NULL,
    description text,
    related_fact_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    related_person_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    related_document_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    related_legal_issue_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: case_facts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_facts (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    fact_type text NOT NULL,
    description text NOT NULL,
    event_date timestamp(3) without time zone,
    event_date_text text,
    is_date_exact boolean DEFAULT true NOT NULL,
    chronological_order integer,
    is_juridically_relevant boolean DEFAULT false NOT NULL,
    relevance_explanation text,
    source_type text,
    source_document_id text,
    source_page integer,
    source_quote text,
    verification_status text DEFAULT 'unverified'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: case_hearings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_hearings (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    hearing_type text NOT NULL,
    title text NOT NULL,
    description text,
    scheduled_at timestamp(3) without time zone,
    location text,
    status text DEFAULT 'scheduled'::text NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: case_jurisprudence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_jurisprudence (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    ruling_id uuid NOT NULL,
    similarity_score numeric(5,2),
    relevance_note text,
    is_applicable boolean,
    analysis_notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: case_legal_issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_legal_issues (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    issue_type text NOT NULL,
    title text NOT NULL,
    legal_question text,
    description text,
    party_position text,
    opposing_position text,
    related_norms jsonb DEFAULT '[]'::jsonb NOT NULL,
    related_rulings jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: case_norms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_norms (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    norm_type text,
    reference text NOT NULL,
    description text,
    relevance text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: case_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_permissions (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    user_id uuid NOT NULL,
    permission text DEFAULT 'read'::text NOT NULL,
    granted_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: case_persons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_persons (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    person_type text NOT NULL,
    full_name text NOT NULL,
    document_type text,
    document_number text,
    email text,
    phone text,
    address text,
    role text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: case_pretensions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_pretensions (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    description text NOT NULL,
    legal_basis text,
    estimated_value numeric(15,2),
    currency text DEFAULT 'COP'::text NOT NULL,
    status text DEFAULT 'proposed'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: case_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_tasks (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    description text NOT NULL,
    task_type text DEFAULT 'action'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    due_date timestamp(3) without time zone,
    is_completed boolean DEFAULT false NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cases (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    legal_area text,
    subarea text,
    process_type text,
    client text,
    court text,
    file_number text,
    city text,
    start_date timestamp(3) without time zone,
    responsible_lawyer text,
    opposing_party text,
    pretensions text,
    amount numeric(15,2),
    priority text DEFAULT 'medium'::text NOT NULL,
    parties jsonb,
    legal_problem_description text,
    previous_proceedings jsonb,
    previous_decisions jsonb,
    additional_info text,
    chronological_facts_ordered boolean DEFAULT false NOT NULL,
    last_activity_at timestamp(3) without time zone,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    case_id uuid,
    title text,
    analysis_mode text DEFAULT 'general_chat'::text NOT NULL,
    context_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: document_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_versions (
    id uuid NOT NULL,
    document_id uuid NOT NULL,
    case_id uuid NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_size integer,
    change_log text,
    created_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: fact_entities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fact_entities (
    id uuid NOT NULL,
    fact_id uuid NOT NULL,
    entity_type text,
    entity_name text,
    entity_role text,
    document_number text
);


--
-- Name: generated_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_documents (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    user_id uuid NOT NULL,
    document_type text NOT NULL,
    title text,
    content text NOT NULL,
    format_version text DEFAULT '1.0'::text NOT NULL,
    quality_checks jsonb,
    quality_passed boolean DEFAULT false NOT NULL,
    docx_url text,
    pdf_url text,
    llm_model text,
    tokens_used integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: ingestion_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ingestion_jobs (
    id uuid NOT NULL,
    source_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    items_processed integer DEFAULT 0 NOT NULL,
    items_total integer,
    items_failed integer DEFAULT 0 NOT NULL,
    error_message text,
    started_at timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: integration_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_connections (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    provider text NOT NULL,
    access_token text,
    refresh_token text,
    token_expires_at timestamp(3) without time zone,
    scope text,
    account_email text,
    account_name text,
    is_active boolean DEFAULT true NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: judgment_relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.judgment_relationships (
    id uuid NOT NULL,
    source_ruling_id uuid NOT NULL,
    target_ruling_id uuid NOT NULL,
    relationship_type text NOT NULL,
    confidence numeric(3,2),
    evidence text,
    detected_by text DEFAULT 'ai'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: law_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.law_chunks (
    id uuid NOT NULL,
    law_id uuid NOT NULL,
    content text NOT NULL,
    article_number text,
    chapter text,
    title text,
    is_vigente boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: laws; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.laws (
    id uuid NOT NULL,
    name text NOT NULL,
    number text,
    year integer,
    type text,
    subtipo text,
    sector text,
    entidad text,
    materia text,
    articulos integer,
    vigencia text,
    description text,
    full_text text,
    source_url text,
    source text DEFAULT 'suin_juriscol'::text NOT NULL,
    is_vigente boolean DEFAULT true NOT NULL,
    modified_by text,
    effective_date timestamp(3) without time zone,
    embedding_status text DEFAULT 'pending'::text NOT NULL,
    last_sync_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: legal_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_templates (
    id uuid NOT NULL,
    name text NOT NULL,
    description text,
    legal_area text NOT NULL,
    subcategory text,
    document_type text NOT NULL,
    purpose text,
    file_type text DEFAULT 'docx'::text NOT NULL,
    file_size integer,
    file_url text NOT NULL,
    thumbnail_url text,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    jurisdiction text DEFAULT 'Colombia'::text,
    is_default boolean DEFAULT false NOT NULL,
    uploaded_by uuid,
    download_count integer DEFAULT 0 NOT NULL,
    favorite_count integer DEFAULT 0 NOT NULL,
    vigency_status text DEFAULT 'vigente'::text NOT NULL,
    last_review_date timestamp(3) without time zone,
    review_year integer,
    related_norms jsonb DEFAULT '[]'::jsonb NOT NULL,
    related_jurisprudence jsonb DEFAULT '[]'::jsonb NOT NULL,
    official_source text,
    source_url text,
    vigency_notes text,
    norm_version text,
    needs_revision boolean DEFAULT false NOT NULL,
    revision_reason text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    citations jsonb DEFAULT '[]'::jsonb NOT NULL,
    sources jsonb DEFAULT '[]'::jsonb NOT NULL,
    model_used text,
    tokens_used integer,
    confidence_score numeric(3,2),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news (
    id uuid NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    content text,
    category text DEFAULT 'nacional'::text NOT NULL,
    source text NOT NULL,
    source_url text,
    image_url text,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    published_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    case_id uuid,
    title text,
    content text,
    related_ruling_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name text NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ruling_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ruling_chunks (
    id uuid NOT NULL,
    ruling_id uuid NOT NULL,
    content text NOT NULL,
    section_type text,
    section_title text,
    hierarchy_path text,
    page_numbers text,
    chunk_level integer DEFAULT 2 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: rulings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rulings (
    id uuid NOT NULL,
    citation text NOT NULL,
    ruling_type text,
    process_type text,
    corporation text NOT NULL,
    chamber text,
    section text,
    magistrate_ponent text,
    magistrates text,
    ruling_date timestamp(3) without time zone,
    publication_date timestamp(3) without time zone,
    legal_area text,
    themes jsonb DEFAULT '[]'::jsonb NOT NULL,
    subthemes jsonb DEFAULT '[]'::jsonb NOT NULL,
    summary text,
    full_text text,
    resuelve text,
    source_url text,
    source_type text DEFAULT 'official'::text NOT NULL,
    source text DEFAULT 'corte_constitucional'::text NOT NULL,
    pdf_url text,
    docx_url text,
    download_urls jsonb DEFAULT '{}'::jsonb NOT NULL,
    radicado text,
    referenced_norms jsonb DEFAULT '[]'::jsonb NOT NULL,
    cited_rulings jsonb DEFAULT '[]'::jsonb NOT NULL,
    citing_rulings jsonb DEFAULT '[]'::jsonb NOT NULL,
    similarity_score numeric(5,2),
    ai_analysis jsonb,
    embedding_status text DEFAULT 'pending'::text NOT NULL,
    last_sync_at timestamp(3) without time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: saved_rulings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_rulings (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    ruling_id uuid NOT NULL,
    case_id uuid,
    notes text,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: source_registry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.source_registry (
    id uuid NOT NULL,
    name text NOT NULL,
    source_type text NOT NULL,
    url text,
    api_url text,
    adapter_class text,
    last_sync_at timestamp(3) without time zone,
    last_sync_status text,
    total_documents integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: template_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.template_favorites (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    template_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_document_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_document_chunks (
    id uuid NOT NULL,
    document_id uuid NOT NULL,
    content text NOT NULL,
    section_type text,
    page_numbers text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_documents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    case_id uuid,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    mime_type text,
    extraction_method text,
    extraction_confidence numeric(3,2),
    extracted_text text,
    document_category text,
    ai_analysis jsonb,
    embedding_status text DEFAULT 'pending'::text NOT NULL,
    linked_fact_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    author text,
    last_modified_at timestamp(3) without time zone,
    sync_status text DEFAULT 'local'::text NOT NULL,
    sync_source text,
    external_id text,
    external_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text,
    document_number text NOT NULL,
    password_hash text NOT NULL,
    full_name text NOT NULL,
    law_firm text,
    phone text,
    role_id text DEFAULT 'lawyer'::text NOT NULL,
    avatar_url text,
    credits integer DEFAULT 1000 NOT NULL,
    daily_credits_used integer DEFAULT 0 NOT NULL,
    daily_credits_reset_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: analysis_conclusions analysis_conclusions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_conclusions
    ADD CONSTRAINT analysis_conclusions_pkey PRIMARY KEY (id);


--
-- Name: analysis_findings analysis_findings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_findings
    ADD CONSTRAINT analysis_findings_pkey PRIMARY KEY (id);


--
-- Name: analysis_sessions analysis_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_sessions
    ADD CONSTRAINT analysis_sessions_pkey PRIMARY KEY (id);


--
-- Name: analysis_sources analysis_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_sources
    ADD CONSTRAINT analysis_sources_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: case_alerts case_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_alerts
    ADD CONSTRAINT case_alerts_pkey PRIMARY KEY (id);


--
-- Name: case_defenses case_defenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_defenses
    ADD CONSTRAINT case_defenses_pkey PRIMARY KEY (id);


--
-- Name: case_events case_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_events
    ADD CONSTRAINT case_events_pkey PRIMARY KEY (id);


--
-- Name: case_evidence case_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_evidence
    ADD CONSTRAINT case_evidence_pkey PRIMARY KEY (id);


--
-- Name: case_facts case_facts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_facts
    ADD CONSTRAINT case_facts_pkey PRIMARY KEY (id);


--
-- Name: case_hearings case_hearings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_hearings
    ADD CONSTRAINT case_hearings_pkey PRIMARY KEY (id);


--
-- Name: case_jurisprudence case_jurisprudence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_jurisprudence
    ADD CONSTRAINT case_jurisprudence_pkey PRIMARY KEY (id);


--
-- Name: case_legal_issues case_legal_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_legal_issues
    ADD CONSTRAINT case_legal_issues_pkey PRIMARY KEY (id);


--
-- Name: case_norms case_norms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_norms
    ADD CONSTRAINT case_norms_pkey PRIMARY KEY (id);


--
-- Name: case_permissions case_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_permissions
    ADD CONSTRAINT case_permissions_pkey PRIMARY KEY (id);


--
-- Name: case_persons case_persons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_persons
    ADD CONSTRAINT case_persons_pkey PRIMARY KEY (id);


--
-- Name: case_pretensions case_pretensions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_pretensions
    ADD CONSTRAINT case_pretensions_pkey PRIMARY KEY (id);


--
-- Name: case_tasks case_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_tasks
    ADD CONSTRAINT case_tasks_pkey PRIMARY KEY (id);


--
-- Name: cases cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);


--
-- Name: fact_entities fact_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fact_entities
    ADD CONSTRAINT fact_entities_pkey PRIMARY KEY (id);


--
-- Name: generated_documents generated_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_documents
    ADD CONSTRAINT generated_documents_pkey PRIMARY KEY (id);


--
-- Name: ingestion_jobs ingestion_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingestion_jobs
    ADD CONSTRAINT ingestion_jobs_pkey PRIMARY KEY (id);


--
-- Name: integration_connections integration_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_connections
    ADD CONSTRAINT integration_connections_pkey PRIMARY KEY (id);


--
-- Name: judgment_relationships judgment_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.judgment_relationships
    ADD CONSTRAINT judgment_relationships_pkey PRIMARY KEY (id);


--
-- Name: law_chunks law_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.law_chunks
    ADD CONSTRAINT law_chunks_pkey PRIMARY KEY (id);


--
-- Name: laws laws_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laws
    ADD CONSTRAINT laws_pkey PRIMARY KEY (id);


--
-- Name: legal_templates legal_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_templates
    ADD CONSTRAINT legal_templates_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: ruling_chunks ruling_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ruling_chunks
    ADD CONSTRAINT ruling_chunks_pkey PRIMARY KEY (id);


--
-- Name: rulings rulings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rulings
    ADD CONSTRAINT rulings_pkey PRIMARY KEY (id);


--
-- Name: saved_rulings saved_rulings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_rulings
    ADD CONSTRAINT saved_rulings_pkey PRIMARY KEY (id);


--
-- Name: source_registry source_registry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.source_registry
    ADD CONSTRAINT source_registry_pkey PRIMARY KEY (id);


--
-- Name: template_favorites template_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_favorites
    ADD CONSTRAINT template_favorites_pkey PRIMARY KEY (id);


--
-- Name: user_document_chunks user_document_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_document_chunks
    ADD CONSTRAINT user_document_chunks_pkey PRIMARY KEY (id);


--
-- Name: user_documents user_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_documents
    ADD CONSTRAINT user_documents_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);


--
-- Name: case_alerts_case_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX case_alerts_case_id_idx ON public.case_alerts USING btree (case_id);


--
-- Name: case_alerts_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX case_alerts_priority_idx ON public.case_alerts USING btree (priority);


--
-- Name: case_events_case_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX case_events_case_id_idx ON public.case_events USING btree (case_id);


--
-- Name: case_events_event_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX case_events_event_date_idx ON public.case_events USING btree (event_date);


--
-- Name: case_evidence_case_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX case_evidence_case_id_idx ON public.case_evidence USING btree (case_id);


--
-- Name: case_facts_case_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX case_facts_case_id_idx ON public.case_facts USING btree (case_id);


--
-- Name: case_hearings_case_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX case_hearings_case_id_idx ON public.case_hearings USING btree (case_id);


--
-- Name: case_jurisprudence_case_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX case_jurisprudence_case_id_idx ON public.case_jurisprudence USING btree (case_id);


--
-- Name: case_jurisprudence_case_id_ruling_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX case_jurisprudence_case_id_ruling_id_key ON public.case_jurisprudence USING btree (case_id, ruling_id);


--
-- Name: case_legal_issues_case_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX case_legal_issues_case_id_idx ON public.case_legal_issues USING btree (case_id);


--
-- Name: case_norms_case_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX case_norms_case_id_idx ON public.case_norms USING btree (case_id);


--
-- Name: case_permissions_case_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX case_permissions_case_id_user_id_key ON public.case_permissions USING btree (case_id, user_id);


--
-- Name: case_persons_case_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX case_persons_case_id_idx ON public.case_persons USING btree (case_id);


--
-- Name: cases_legal_area_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cases_legal_area_idx ON public.cases USING btree (legal_area);


--
-- Name: cases_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cases_status_idx ON public.cases USING btree (status);


--
-- Name: cases_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cases_user_id_idx ON public.cases USING btree (user_id);


--
-- Name: conversations_case_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversations_case_id_idx ON public.conversations USING btree (case_id);


--
-- Name: conversations_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversations_user_id_idx ON public.conversations USING btree (user_id);


--
-- Name: document_versions_case_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_versions_case_id_idx ON public.document_versions USING btree (case_id);


--
-- Name: document_versions_document_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_versions_document_id_idx ON public.document_versions USING btree (document_id);


--
-- Name: generated_documents_case_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX generated_documents_case_id_idx ON public.generated_documents USING btree (case_id);


--
-- Name: integration_connections_user_id_provider_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX integration_connections_user_id_provider_key ON public.integration_connections USING btree (user_id, provider);


--
-- Name: judgment_relationships_source_ruling_id_target_ruling_id_re_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX judgment_relationships_source_ruling_id_target_ruling_id_re_key ON public.judgment_relationships USING btree (source_ruling_id, target_ruling_id, relationship_type);


--
-- Name: law_chunks_law_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX law_chunks_law_id_idx ON public.law_chunks USING btree (law_id);


--
-- Name: laws_entidad_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX laws_entidad_idx ON public.laws USING btree (entidad);


--
-- Name: laws_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX laws_source_idx ON public.laws USING btree (source);


--
-- Name: laws_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX laws_type_idx ON public.laws USING btree (type);


--
-- Name: laws_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX laws_year_idx ON public.laws USING btree (year);


--
-- Name: legal_templates_document_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_templates_document_type_idx ON public.legal_templates USING btree (document_type);


--
-- Name: legal_templates_is_default_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_templates_is_default_idx ON public.legal_templates USING btree (is_default);


--
-- Name: legal_templates_legal_area_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_templates_legal_area_idx ON public.legal_templates USING btree (legal_area);


--
-- Name: legal_templates_official_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_templates_official_source_idx ON public.legal_templates USING btree (official_source);


--
-- Name: legal_templates_purpose_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_templates_purpose_idx ON public.legal_templates USING btree (purpose);


--
-- Name: legal_templates_review_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_templates_review_year_idx ON public.legal_templates USING btree (review_year);


--
-- Name: legal_templates_vigency_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_templates_vigency_status_idx ON public.legal_templates USING btree (vigency_status);


--
-- Name: messages_conversation_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_conversation_id_idx ON public.messages USING btree (conversation_id);


--
-- Name: news_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX news_category_idx ON public.news USING btree (category);


--
-- Name: news_is_featured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX news_is_featured_idx ON public.news USING btree (is_featured);


--
-- Name: news_published_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX news_published_at_idx ON public.news USING btree (published_at);


--
-- Name: ruling_chunks_ruling_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ruling_chunks_ruling_id_idx ON public.ruling_chunks USING btree (ruling_id);


--
-- Name: rulings_citation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rulings_citation_idx ON public.rulings USING btree (citation);


--
-- Name: rulings_corporation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rulings_corporation_idx ON public.rulings USING btree (corporation);


--
-- Name: rulings_embedding_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rulings_embedding_status_idx ON public.rulings USING btree (embedding_status);


--
-- Name: rulings_legal_area_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rulings_legal_area_idx ON public.rulings USING btree (legal_area);


--
-- Name: rulings_ruling_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rulings_ruling_date_idx ON public.rulings USING btree (ruling_date);


--
-- Name: rulings_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rulings_source_idx ON public.rulings USING btree (source);


--
-- Name: saved_rulings_user_id_ruling_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX saved_rulings_user_id_ruling_id_key ON public.saved_rulings USING btree (user_id, ruling_id);


--
-- Name: template_favorites_user_id_template_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX template_favorites_user_id_template_id_key ON public.template_favorites USING btree (user_id, template_id);


--
-- Name: user_document_chunks_document_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_document_chunks_document_id_idx ON public.user_document_chunks USING btree (document_id);


--
-- Name: user_documents_case_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_documents_case_id_idx ON public.user_documents USING btree (case_id);


--
-- Name: user_documents_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_documents_user_id_idx ON public.user_documents USING btree (user_id);


--
-- Name: users_document_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_document_number_key ON public.users USING btree (document_number);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: analysis_conclusions analysis_conclusions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_conclusions
    ADD CONSTRAINT analysis_conclusions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.analysis_sessions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: analysis_findings analysis_findings_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_findings
    ADD CONSTRAINT analysis_findings_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.analysis_sessions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: analysis_sessions analysis_sessions_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_sessions
    ADD CONSTRAINT analysis_sessions_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: analysis_sessions analysis_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_sessions
    ADD CONSTRAINT analysis_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: analysis_sources analysis_sources_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_sources
    ADD CONSTRAINT analysis_sources_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.analysis_sessions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: case_alerts case_alerts_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_alerts
    ADD CONSTRAINT case_alerts_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: case_defenses case_defenses_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_defenses
    ADD CONSTRAINT case_defenses_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: case_events case_events_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_events
    ADD CONSTRAINT case_events_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: case_evidence case_evidence_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_evidence
    ADD CONSTRAINT case_evidence_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: case_facts case_facts_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_facts
    ADD CONSTRAINT case_facts_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: case_hearings case_hearings_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_hearings
    ADD CONSTRAINT case_hearings_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: case_jurisprudence case_jurisprudence_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_jurisprudence
    ADD CONSTRAINT case_jurisprudence_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: case_legal_issues case_legal_issues_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_legal_issues
    ADD CONSTRAINT case_legal_issues_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: case_norms case_norms_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_norms
    ADD CONSTRAINT case_norms_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: case_permissions case_permissions_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_permissions
    ADD CONSTRAINT case_permissions_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: case_permissions case_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_permissions
    ADD CONSTRAINT case_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: case_persons case_persons_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_persons
    ADD CONSTRAINT case_persons_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: case_pretensions case_pretensions_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_pretensions
    ADD CONSTRAINT case_pretensions_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: case_tasks case_tasks_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_tasks
    ADD CONSTRAINT case_tasks_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cases cases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: conversations conversations_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conversations conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: document_versions document_versions_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fact_entities fact_entities_fact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fact_entities
    ADD CONSTRAINT fact_entities_fact_id_fkey FOREIGN KEY (fact_id) REFERENCES public.case_facts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: generated_documents generated_documents_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_documents
    ADD CONSTRAINT generated_documents_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: generated_documents generated_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_documents
    ADD CONSTRAINT generated_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ingestion_jobs ingestion_jobs_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingestion_jobs
    ADD CONSTRAINT ingestion_jobs_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.source_registry(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: integration_connections integration_connections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_connections
    ADD CONSTRAINT integration_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: judgment_relationships judgment_relationships_source_ruling_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.judgment_relationships
    ADD CONSTRAINT judgment_relationships_source_ruling_id_fkey FOREIGN KEY (source_ruling_id) REFERENCES public.rulings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: judgment_relationships judgment_relationships_target_ruling_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.judgment_relationships
    ADD CONSTRAINT judgment_relationships_target_ruling_id_fkey FOREIGN KEY (target_ruling_id) REFERENCES public.rulings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: law_chunks law_chunks_law_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.law_chunks
    ADD CONSTRAINT law_chunks_law_id_fkey FOREIGN KEY (law_id) REFERENCES public.laws(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notes notes_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notes notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ruling_chunks ruling_chunks_ruling_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ruling_chunks
    ADD CONSTRAINT ruling_chunks_ruling_id_fkey FOREIGN KEY (ruling_id) REFERENCES public.rulings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: saved_rulings saved_rulings_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_rulings
    ADD CONSTRAINT saved_rulings_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: saved_rulings saved_rulings_ruling_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_rulings
    ADD CONSTRAINT saved_rulings_ruling_id_fkey FOREIGN KEY (ruling_id) REFERENCES public.rulings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: saved_rulings saved_rulings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_rulings
    ADD CONSTRAINT saved_rulings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: template_favorites template_favorites_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_favorites
    ADD CONSTRAINT template_favorites_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.legal_templates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: template_favorites template_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_favorites
    ADD CONSTRAINT template_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_document_chunks user_document_chunks_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_document_chunks
    ADD CONSTRAINT user_document_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.user_documents(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_documents user_documents_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_documents
    ADD CONSTRAINT user_documents_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_documents user_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_documents
    ADD CONSTRAINT user_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--


