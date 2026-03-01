from functools import lru_cache
from langchain_ollama import ChatOllama
from langchain_core.language_models import BaseChatModel

from .config import settings


@lru_cache(maxsize=2)   
def get_doctor_llm(streaming: bool = False) -> BaseChatModel:
    return ChatOllama(
        model=settings.doctor_model,
        base_url=settings.ollama_base_url,
        num_ctx=8192,
        streaming=streaming,
        keep_alive="10m",
    )


@lru_cache(maxsize=2)
def get_patient_llm(streaming: bool = False) -> BaseChatModel:
    return ChatOllama(
        model=settings.patient_model,
        base_url=settings.ollama_base_url,
        num_ctx=8192,
        streaming=streaming,
        keep_alive="10m",
    )
