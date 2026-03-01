"""
api.py — FastAPI app for the physician RAG chatbot.

Endpoints:
  POST /chat — Query the doctor RAG chain for a given patient.
  GET  /health — Health check.

Run: uvicorn api:app --reload
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from rag import build_doctor_chain, settings

app = FastAPI(title="HackRare 2026 — Physician RAG Chatbot")


class ChatRequest(BaseModel):
    patient_id: str  # UUID of patient (or auth user_id when 1:1)
    question: str


class ChatResponse(BaseModel):
    answer: str


@app.get("/health")
def health():
    return {"status": "ok", "model": settings.doctor_model}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Run the physician RAG chain for a clinical query about a patient."""
    try:
        chain = build_doctor_chain(patient_id=request.patient_id, streaming=False)
        answer = chain.invoke(request.question)
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
