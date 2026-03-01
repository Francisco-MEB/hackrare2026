"""
retriever.py — Retrieval layer: vector store → top-k relevant chunks.

Key design choices:
  - `score_threshold` filters out low-confidence matches before they pollute the LLM prompt.
    This is critical for medical accuracy — we'd rather return fewer chunks than hallucinate.
  - `search_type="similarity_score_threshold"` uses cosine similarity (matches pgvector index).
  - `MergerRetriever` (ensemble) for the doctor mode merges disease-knowledge chunks
    with patient-specific chunks in a single ranked list.  This mirrors how a clinician
    actually thinks: disease context + patient history simultaneously.
  - `EmbeddingsRedundantFilter` deduplicates near-identical chunks so the LLM context
    window isn't wasted on repeated information.
"""

from langchain.retrievers import MergerRetriever, EnsembleRetriever
from langchain_community.document_transformers import EmbeddingsRedundantFilter
from langchain.retrievers.document_compressors import DocumentCompressorPipeline
from langchain.retrievers import ContextualCompressionRetriever
from langchain_core.vectorstores import VectorStore
from langchain_core.retrievers import BaseRetriever

from .config import settings
from .embeddings import get_embeddings
from .vectorstore import get_documents_store, get_patient_records_store


def _base_retriever(store: VectorStore, top_k: int | None = None) -> BaseRetriever:
    """
    Wrap a VectorStore into a LangChain retriever with score-threshold filtering.

    Args:
        store:  The Supabase vector store to search.
        top_k:  Number of chunks to return; defaults to settings.rag_top_k.
    """
    k = top_k or settings.rag_top_k
    return store.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={
            "k": k,
            "score_threshold": settings.rag_similarity_threshold,
        },
    )


def _dedup_compressor() -> DocumentCompressorPipeline:
    """
    Post-retrieval pipeline that removes near-duplicate chunks.
    Embeddings are re-used (cached) — no extra inference cost.
    """
    redundancy_filter = EmbeddingsRedundantFilter(
        embeddings=get_embeddings(),
        similarity_threshold=0.95,   # chunks >95% similar are collapsed
    )
    return DocumentCompressorPipeline(transformers=[redundancy_filter])


def get_patient_retriever(patient_id: str) -> BaseRetriever:
    """
    Retriever for the patient-facing chatbot.

    Searches two sources in parallel and merges results:
      1. General disease-knowledge base (disease info, FAQs, guidelines)
      2. This patient's own clinical record (symptoms, medications, flares)

    Args:
        patient_id: UUID of the logged-in patient.
    """
    disease_retriever = _base_retriever(get_documents_store())
    patient_retriever = _base_retriever(get_patient_records_store(patient_id))

    merged = MergerRetriever(retrievers=[disease_retriever, patient_retriever])

    # Wrap in compressor to deduplicate before LLM sees the context
    return ContextualCompressionRetriever(
        base_compressor=_dedup_compressor(),
        base_retriever=merged,
    )


def get_doctor_retriever(patient_id: str, top_k_per_source: int = 8) -> BaseRetriever:
    """
    Retriever for the doctor-facing chatbot.

    Returns more chunks per source than the patient retriever because doctors
    can handle higher information density.  Still deduplicates to avoid
    wasting LLM context tokens.

    Args:
        patient_id:        UUID of the patient being reviewed.
        top_k_per_source:  Chunks pulled from each source before dedup.
    """
    disease_retriever = _base_retriever(get_documents_store(), top_k=top_k_per_source)
    patient_retriever = _base_retriever(
        get_patient_records_store(patient_id), top_k=top_k_per_source
    )

    merged = MergerRetriever(retrievers=[disease_retriever, patient_retriever])

    return ContextualCompressionRetriever(
        base_compressor=_dedup_compressor(),
        base_retriever=merged,
    )
