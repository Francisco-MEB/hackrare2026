"""
llm.py — LLM instances for the two NeuraCare chatbot models.

Both models are custom Ollama builds from the Modelfiles:
  ollama create gemma3-doctor  -f Modelfile.doctor
  ollama create gemma3-patient -f Modelfile.patient

Why we do NOT set temperature / top_p / top_k here:
  Those parameters are already defined in the Modelfiles themselves.
  Setting them again in LangChain would override the Modelfile values,
  breaking the carefully tuned behavior (e.g. doctor at 0.3 for clinical
  precision, patient at 0.6 for warmer conversational tone).

What we DO set:
  num_ctx=8192  — context window large enough for system prompt + RAG chunks + question.
                  This is safe to set here since it's infrastructure, not behavior.
  keep_alive    — keeps the model loaded in VRAM between requests (no cold-start lag).
  streaming     — toggled per call for streaming vs batch responses.

Pre-requisites (run once):
  ollama create gemma3-doctor  -f Modelfile.doctor
  ollama create gemma3-patient -f Modelfile.patient
  ollama pull nomic-embed-text
"""

from functools import lru_cache
from langchain_ollama import ChatOllama
from langchain_core.language_models import BaseChatModel

from .config import settings


@lru_cache(maxsize=2)   # caches (False,) and (True,) variants
def get_doctor_llm(streaming: bool = False) -> BaseChatModel:
    """
    LLM instance for the doctor portal.
    Uses gemma3-doctor:latest — clinical, structured, citation-driven.
    Temperature (0.3) and sampling params are set in Modelfile.doctor.
    """
    return ChatOllama(
        model=settings.doctor_model,
        base_url=settings.ollama_base_url,
        num_ctx=8192,
        streaming=streaming,
        keep_alive="10m",
    )


@lru_cache(maxsize=2)
def get_patient_llm(streaming: bool = False) -> BaseChatModel:
    """
    LLM instance for the patient portal.
    Uses gemma3-patient:latest — warm, plain language, safety-guardrailed.
    Temperature (0.6) and sampling params are set in Modelfile.patient.
    """
    return ChatOllama(
        model=settings.patient_model,
        base_url=settings.ollama_base_url,
        num_ctx=8192,
        streaming=streaming,
        keep_alive="10m",
    )
