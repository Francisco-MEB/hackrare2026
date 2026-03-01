"""
config.py — Centralized settings loaded from environment variables.

All tuneable knobs (model names, top-k, chunk size, thresholds) live here so
the rest of the codebase stays clean and environment-agnostic.
Pydantic validates types at startup — bad/missing env vars surface immediately
rather than causing cryptic runtime failures.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Supabase ──────────────────────────────────────────────────────────────
    # TODO: fill in once you have project credentials
    supabase_url: str = "https://placeholder.supabase.co"
    supabase_service_key: str = "placeholder-service-key"

    # ── Ollama (local — no API key) ───────────────────────────────────────────
    ollama_base_url: str = "http://localhost:11434"
    # Custom models built from the Modelfiles (run once to create them):
    #   ollama create gemma3-doctor  -f Modelfile.doctor
    #   ollama create gemma3-patient -f Modelfile.patient
    doctor_model: str = "gemma3-doctor:latest"
    patient_model: str = "gemma3-patient:latest"
    ollama_embed_model: str = "nomic-embed-text"   # ollama pull nomic-embed-text

    # ── Vector store table names in Supabase ─────────────────────────────────
    # These match the SQL schema in supabase/schema.sql
    documents_table: str = "rag_documents"         # general medical / disease knowledge
    patient_records_table: str = "rag_patient_records"  # per-patient clinical data

    # ── RAG retrieval tuning ──────────────────────────────────────────────────
    rag_top_k: int = 5                    # chunks passed to LLM per query
    rag_chunk_size: int = 800             # characters per chunk (not tokens)
    rag_chunk_overlap: int = 150          # overlap between adjacent chunks
    rag_similarity_threshold: float = 0.70  # cosine similarity cutoff (0–1)

    # ── Misc ──────────────────────────────────────────────────────────────────
    app_env: str = "development"
    log_level: str = "INFO"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton — avoids re-parsing .env on every import."""
    return Settings()


settings = get_settings()
