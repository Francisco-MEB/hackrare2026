DROP FUNCTION IF EXISTS match_rag_patient_records(vector, jsonb, integer);
DROP FUNCTION IF EXISTS match_rag_documents(vector, jsonb, integer);
DROP TABLE IF EXISTS rag_patient_records;
DROP TABLE IF EXISTS rag_documents;

create table rag_documents (
    id        uuid         primary key default gen_random_uuid(),
    content   text         not null,
    metadata  jsonb        not null default '{}',
    embedding vector(768)  not null
);

create index rag_documents_embedding_idx
    on rag_documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table rag_patient_records (
    id        uuid         primary key default gen_random_uuid(),
    content   text         not null,
    metadata  jsonb        not null default '{}',
    embedding vector(768)  not null
);

create index rag_patient_records_user_idx
    on rag_patient_records ((metadata->>'user_id'));
create index rag_patient_records_embedding_idx
    on rag_patient_records using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create or replace function match_rag_documents(
    query_embedding  vector(768),
    filter           jsonb default '{}',
    "limit"          int   default 5
)
returns table (id uuid, content text, metadata jsonb, similarity float)
language plpgsql as $$
begin
    return query
    select d.id, d.content, d.metadata,
           1 - (d.embedding <=> query_embedding) as similarity
    from rag_documents d
    where d.metadata @> filter
    order by d.embedding <=> query_embedding
    limit "limit";
end;
$$;

create or replace function match_rag_patient_records(
    query_embedding  vector(768),
    filter           jsonb default '{}',
    "limit"          int   default 5
)
returns table (id uuid, content text, metadata jsonb, similarity float)
language plpgsql as $$
begin
    return query
    select r.id, r.content, r.metadata,
           1 - (r.embedding <=> query_embedding) as similarity
    from rag_patient_records r
    where (r.metadata->>'user_id') = (filter->>'user_id')
      and r.metadata @> (filter - 'user_id')
    order by r.embedding <=> query_embedding
    limit "limit";
end;
$$;
