"""
HackRare 2026 — RAG Module
Symptom Management Track | Rare Neurological Diseases

Architecture:
  Supabase (pgvector) → top-k retriever → Gemma3:27b (Ollama) → structured response

Two chatbot modes:
  - PatientRAG  : low cognitive load; queries patient's own history + disease knowledge
  - DoctorRAG   : note-format output; queries full patient record + clinical literature
"""

from .chains import build_patient_chain, build_doctor_chain
from .ingest import ingest_documents, ingest_patient_record
from .config import settings

__all__ = [
    "build_patient_chain",
    "build_doctor_chain",
    "ingest_documents",
    "ingest_patient_record",
    "settings",
]
