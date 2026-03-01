-- =============================================================================
-- HackRare 2026 — Supabase pgvector Schema
-- Run this once in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- Enable pgvector (required for vector columns + cosine similarity search)
create extension if not exists vector with schema extensions;


-- =============================================================================
-- TABLE: rag_documents
-- Shared disease-knowledge base (research papers, guidelines, FAQs).
-- Not tied to any patient — readable by all authenticated users.
-- =============================================================================

create table if not exists rag_documents (
    id        bigserial    primary key,
    content   text         not null,
    metadata  jsonb        not null default '{}',  -- source, doc_type, date
    embedding vector(768)  not null                -- nomic-embed-text dimension
);

-- Fast approximate nearest-neighbour index (cosine distance)
create index if not exists rag_documents_embedding_idx
    on rag_documents
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);


-- =============================================================================
-- TABLE: rag_patient_records
-- Per-patient entries: symptom logs, custom notes, medication entries, etc.
-- user_id ties each row to a Supabase Auth account.
-- =============================================================================

create table if not exists rag_patient_records (
    id        bigserial    primary key,
    user_id   uuid         not null references auth.users(id) on delete cascade,
    content   text         not null,
    metadata  jsonb        not null default '{}',  -- doc_type, date, disease, etc.
    embedding vector(768)  not null
);

create index if not exists rag_patient_records_user_idx
    on rag_patient_records (user_id);

create index if not exists rag_patient_records_embedding_idx
    on rag_patient_records
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);


-- =============================================================================
-- ROW LEVEL SECURITY
-- Patients can only read/write their own rows.
-- The backend uses the service_role key which bypasses RLS (for doctor access).
-- =============================================================================

alter table rag_patient_records enable row level security;

create policy "patients_own_records"
    on rag_patient_records
    for all
    using      (auth.uid() = user_id)
    with check (auth.uid() = user_id);

alter table rag_documents enable row level security;

create policy "authenticated_read_documents"
    on rag_documents
    for select
    using (auth.role() = 'authenticated');


-- =============================================================================
-- RPC: match_rag_documents
-- LangChain calls this when retrieving from the shared knowledge base.
-- =============================================================================

create or replace function match_rag_documents(
    query_embedding  vector(768),
    match_count      int   default 5,
    filter           jsonb default '{}'
)
returns table (
    id         bigint,
    content    text,
    metadata   jsonb,
    similarity float
)
language plpgsql as $$
begin
    return query
    select
        d.id,
        d.content,
        d.metadata,
        1 - (d.embedding <=> query_embedding) as similarity
    from rag_documents d
    where d.metadata @> filter
    order by d.embedding <=> query_embedding
    limit match_count;
end;
$$;


-- =============================================================================
-- RPC: match_rag_patient_records
-- LangChain calls this when retrieving a patient's own records.
-- filter must contain {"user_id": "<uuid>"} — set in vectorstore.py.
-- =============================================================================

create or replace function match_rag_patient_records(
    query_embedding  vector(768),
    match_count      int   default 5,
    filter           jsonb default '{}'
)
returns table (
    id         bigint,
    content    text,
    metadata   jsonb,
    similarity float
)
language plpgsql as $$
begin
    return query
    select
        r.id,
        r.content,
        r.metadata,
        1 - (r.embedding <=> query_embedding) as similarity
    from rag_patient_records r
    where r.user_id = (filter->>'user_id')::uuid
      and r.metadata @> (filter - 'user_id')
    order by r.embedding <=> query_embedding
    limit match_count;
end;
$$;
