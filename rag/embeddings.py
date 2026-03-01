"""
embeddings.py — Embedding model factory.

Converts text (chunks or queries) → dense float vectors stored in Supabase pgvector.

Why nomic-embed-text?
  - Runs 100% locally via Ollama (no API key, no cost, no rate limits)
  - 768-dim vectors, strong on biomedical / clinical text
  - Pull once: `ollama pull nomic-embed-text`

Swap path (when ready):
  Set OLLAMA_EMBED_MODEL=<other model> or replace OllamaEmbeddings with
  langchain_openai.OpenAIEmbeddings and add OPENAI_API_KEY to .env.
"""

from functools import lru_cache
from langchain_ollama import OllamaEmbeddings
from langchain_core.embeddings import Embeddings

from .config import settings


@lru_cache(maxsize=1)
def get_embeddings() -> Embeddings:
    """
    Return a cached embedding model instance.
    Cached so the same model object is reused across ingestion and retrieval,
    which avoids re-initializing the Ollama HTTP connection repeatedly.
    """
    return OllamaEmbeddings(
        model=settings.ollama_embed_model,
        base_url=settings.ollama_base_url,
    )
