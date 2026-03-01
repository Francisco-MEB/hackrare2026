import os
from pathlib import Path
from datetime import datetime
from typing import Literal

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader

from .config import settings
from .vectorstore import get_documents_store, get_patient_records_store

PatientDocType = Literal[
    "symptom_log",      
    "custom_note",      
    "medication_entry", 
    "flare_report",     
    "appointment_note", 
    "device_reading",   
    "patient_summary",  
    "other",
]

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.rag_chunk_size,
    chunk_overlap=settings.rag_chunk_overlap,
    separators=["\n\n", "\n", ". ", " ", ""],
)

def ingest_patient_entry(
    user_id: str,
    content: str | dict,
    doc_type: PatientDocType = "other",
    date: str | None = None,
    extra_metadata: dict | None = None,
) -> int: 
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

def ingest_documents(
    source: str,
    doc_type: str = "knowledge",
    date: str | None = None,
) -> int:
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
