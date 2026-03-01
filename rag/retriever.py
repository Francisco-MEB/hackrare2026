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

from langchain_classic.retrievers import MergerRetriever, ContextualCompressionRetriever
from langchain_classic.retrievers.document_compressors import DocumentCompressorPipeline
from langchain_community.document_transformers import EmbeddingsRedundantFilter
from langchain_core.vectorstores import VectorStore
from langchain_core.retrievers import BaseRetriever

from .config import settings
from .embeddings import get_embeddings
from .vectorstore import get_documents_store, get_patient_records_store


def _base_retriever(
    store: VectorStore,
    top_k: int | None = None,
    filter: dict | None = None,
) -> BaseRetriever:
    k = top_k or settings.rag_top_k
    search_kwargs = {
        "k": k,
        "score_threshold": settings.rag_similarity_threshold,
    }
    if filter:
        search_kwargs["filter"] = filter
    return store.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs=search_kwargs,
    )


def _dedup_compressor() -> DocumentCompressorPipeline: 
    redundancy_filter = EmbeddingsRedundantFilter(
        embeddings=get_embeddings(),
        similarity_threshold=0.95,  
    )
    return DocumentCompressorPipeline(transformers=[redundancy_filter])


def get_patient_retriever(patient_id: str) -> BaseRetriever:
    disease_retriever = _base_retriever(get_documents_store())
    patient_retriever = _base_retriever(
        get_patient_records_store(patient_id),
        filter={"user_id": patient_id},
    )

    merged = MergerRetriever(retrievers=[disease_retriever, patient_retriever])

    # Wrap in compressor to deduplicate before LLM sees the context
    return ContextualCompressionRetriever(
        base_compressor=_dedup_compressor(),
        base_retriever=merged,
    )


def get_doctor_retriever(patient_id: str, top_k_per_source: int = 8) -> BaseRetriever:
    disease_retriever = _base_retriever(get_documents_store(), top_k=top_k_per_source)
    patient_retriever = _base_retriever(
        get_patient_records_store(patient_id),
        top_k=top_k_per_source,
        filter={"user_id": patient_id},
    )

    merged = MergerRetriever(retrievers=[disease_retriever, patient_retriever])

    return ContextualCompressionRetriever(
        base_compressor=_dedup_compressor(),
        base_retriever=merged,
    )
