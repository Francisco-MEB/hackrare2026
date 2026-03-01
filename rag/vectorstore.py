"""
vectorstore.py — Supabase pgvector store connections.

Two separate stores reflect the two data domains:
  1. `documents_store`       — disease knowledge base (research, guidelines, FAQs)
                               shared across all users; ingested by the admin/backend
  2. `patient_records_store` — per-patient clinical data (symptoms, meds, notes)
                               scoped to a patient_id via metadata filtering

Why separate tables?
  Keeps access control clean: the patient portal only ever touches rag_patient_records
  filtered to the logged-in user's ID.  The doctor portal can query both.

Schema:
  See supabase/schema.sql for the CREATE TABLE and match_documents() RPC that
  LangChain calls under the hood.

TODO: replace placeholder credentials in .env before using in production.
"""

from functools import lru_cache
from supabase import create_client, Client
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_core.vectorstores import VectorStore

from .config import settings
from .embeddings import get_embeddings


@lru_cache(maxsize=1)
def _supabase_client() -> Client:
    """Singleton Supabase client — reuses the HTTP connection pool."""
    return create_client(settings.supabase_url, settings.supabase_service_key)


def get_documents_store() -> VectorStore:
    """
    Vector store for the shared disease-knowledge base.
    Used by both patient and doctor chatbots for disease-level context
    (e.g. 'What triggers flares in NMOSD?').
    """
    client = _supabase_client()
    return SupabaseVectorStore(
        client=client,
        embedding=get_embeddings(),
        table_name=settings.documents_table,
        query_name="match_rag_documents",   # SQL function defined in schema.sql
    )


def get_patient_records_store(patient_id: str) -> VectorStore:
    """
    Vector store scoped to a single patient's clinical data.
    Metadata filter ensures only that patient's records are retrieved,
    so queries like 'When was my last flare?' return personalised answers.

    Args:
        patient_id: UUID of the patient (matches `patient_id` in metadata).
    """
    client = _supabase_client()
    # SupabaseVectorStore supports metadata filtering via the `filter` kwarg
    # which is forwarded to the match_rag_patient_records RPC as a WHERE clause.
    return SupabaseVectorStore(
        client=client,
        embedding=get_embeddings(),
        table_name=settings.patient_records_table,
        query_name="match_rag_patient_records",
        filter={"patient_id": patient_id},
    )
