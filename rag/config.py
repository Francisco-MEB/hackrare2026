import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://placeholder.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "placeholder-service-key")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
 
    supabase_url: str = SUPABASE_URL
    supabase_service_key: str = SUPABASE_SERVICE_ROLE_KEY

    ollama_base_url: str = "http://localhost:11434"
    # doctor_model: str = "hf.co/slplayford/neuro-gemma3-12b:Q8_0"
    # patient_model: str = "hf.co/slplayford/neuro-gemma3-12b:Q8_0"
    doctor_model: str = "doctor-chatbot"
    patient_model: str = "gemma3:12b" 
    ollama_embed_model: str = "nomic-embed-text:latest"  

    documents_table: str = "rag_documents"         
    patient_records_table: str = "rag_patient_records"

    rag_top_k: int = 5 
    rag_chunk_size: int = 800 
    rag_chunk_overlap: int = 150 
    rag_similarity_threshold: float = 0.5 
 
    app_env: str = "development"
    log_level: str = "INFO"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
