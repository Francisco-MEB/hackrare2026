"""
ingest.py — Document ingestion pipeline (write side of RAG).

Two ingestion sources:
  1. Patient app interactions  — structured inputs from the UI (symptom logs,
                                  custom notes, medication entries).  These are
                                  the primary data source: every time a patient
                                  submits data in the app, it gets embedded and
                                  stored with their user_id in metadata.
  2. Knowledge base documents  — disease guidelines, research, FAQs uploaded by
                                  admin; shared across all patients.

Flow for both paths:
  raw text / structured dict
    → format into readable text block
    → split into overlapping chunks
    → embed (nomic-embed-text via Ollama)
    → upsert into Supabase pgvector table

Patient metadata schema (attached to every patient chunk):
  user_id    : the patient's account UUID (from Supabase Auth)
  doc_type   : what kind of entry this is (see PatientDocType below)
  date       : ISO date of the entry
  source     : human-readable label (e.g. 'symptom-log', 'custom-note')

The retriever in retriever.py filters on user_id so each patient only ever
gets their own records back — no cross-patient data leakage.
"""

import os
from pathlib import Path
from datetime import datetime
from typing import Literal

from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader

from .config import settings
from .vectorstore import get_documents_store, get_patient_records_store


# Allowed doc_type values for patient records
PatientDocType = Literal[
    "symptom_log",      # patient logged a symptom entry via the symptom page
    "custom_note",      # free-text note the patient typed themselves
    "medication_entry", # medication timing / adherence record
    "flare_report",     # patient flagged a flare event
    "appointment_note", # note attached to a specific appointment
    "device_reading",   # data from a connected device (e.g. wearable)
    "other",
]

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.rag_chunk_size,
    chunk_overlap=settings.rag_chunk_overlap,
    separators=["\n\n", "\n", ". ", " ", ""],
)


# ── Patient app interaction ingestion ─────────────────────────────────────────

def ingest_patient_entry(
    user_id: str,
    content: str | dict,
    doc_type: PatientDocType = "other",
    date: str | None = None,
    extra_metadata: dict | None = None,
) -> int:
    """
    Ingest a single patient-generated entry from the app UI.

    Called every time a patient submits data — symptom log, custom note,
    medication entry, etc.  The user_id (from Supabase Auth) is embedded
    in the chunk metadata so the retriever can filter to only this patient.

    Args:
        user_id:        The patient's Supabase Auth UUID.
        content:        Either a plain string (e.g. a typed note) or a dict
                        (e.g. structured symptom form: {'pain': 7, 'fatigue': 'high'}).
                        Dicts are serialized into a readable text block automatically.
        doc_type:       Category of this entry — used for filtering and citations.
        date:           ISO date string (YYYY-MM-DD); defaults to today.
        extra_metadata: Any additional key-value pairs to attach (e.g. disease_name,
                        appointment_id, device_id).

    Returns:
        Number of chunks stored (usually 1 for short entries).
    """
    # Serialize dict inputs into readable text so the LLM can parse them
    if isinstance(content, dict):
        text = "\n".join(f"{k}: {v}" for k, v in content.items())
    else:
        text = content

    metadata = {
        "user_id": user_id,
        "doc_type": doc_type,
        "date": date or datetime.utcnow().date().isoformat(),
        "source": doc_type.replace("_", "-"),
    }
    if extra_metadata:
        metadata.update(extra_metadata)

    doc = Document(page_content=text, metadata=metadata)
    chunks = _splitter.split_documents([doc])

    store = get_patient_records_store(user_id)
    store.add_documents(chunks)

    return len(chunks)


# ── Knowledge base ingestion (admin/backend only) ─────────────────────────────

def ingest_documents(
    source: str,
    doc_type: str = "knowledge",
    date: str | None = None,
) -> int:
    """
    Ingest a file or raw text into the shared disease-knowledge vector store.
    This is for admin-uploaded content (research papers, disease guidelines, FAQs)
    that is shared across all patients — not tied to any individual user_id.

    Args:
        source:   File path (pdf/docx/txt) OR a raw text string.
        doc_type: Label for the document category.
        date:     Optional ISO date string.

    Returns:
        Number of chunks stored.
    """
    if os.path.isfile(source):
        path = Path(source)
        suffix = path.suffix.lower()
        if suffix == ".pdf":
            raw_docs = PyPDFLoader(str(path)).load()
        elif suffix == ".docx":
            raw_docs = Docx2txtLoader(str(path)).load()
        elif suffix in (".txt", ".md"):
            raw_docs = TextLoader(str(path), encoding="utf-8").load()
        else:
            raise ValueError(f"Unsupported file type: {suffix}")
        name = path.name
    else:
        raw_docs = [Document(page_content=source, metadata={"source": "inline"})]
        name = "inline"

    for doc in raw_docs:
        doc.metadata.update({
            "source": doc.metadata.get("source", name),
            "doc_type": doc_type,
            "date": date or datetime.utcnow().date().isoformat(),
        })

    chunks = _splitter.split_documents(raw_docs)
    get_documents_store().add_documents(chunks)

    return len(chunks)
