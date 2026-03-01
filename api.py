from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag import build_doctor_chain, settings
from rag.dashboard import get_dashboard_data
from rag.patient_context import fetch_patient_data
from rag.vectorstore import get_supabase_client

app = FastAPI(title="HackRare 2026 — Physician RAG Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    patient_id: str
    question: str


class SymptomLogEntry(BaseModel):
    symptom_name: str
    severity: int  # 1-10
    notes: str | None = None


class SymptomLogRequest(BaseModel):
    entries: list[SymptomLogEntry]


class ChatResponse(BaseModel):
    answer: str


SUMMARY_PROMPT = """Max 90 words. Do NOT mention the patient's name or disease. Start directly with symptoms. Summarize: meds and adherence, symptom severity, upcoming appointments. One paragraph, no line breaks."""

INTERPRETATION_PROMPT = """Based on the retrieved patient context, write a short "In plain English" paragraph (2-3 sentences). Use simple language for quick physician review. Write in plain prose only—no markdown, newlines, bullet points, or asterisks."""

CHAT_PROSE_INSTRUCTION = " Write as ONE continuous paragraph with no line breaks—no newlines, no Enter. Plain prose only."


@app.get("/health")
def health():
    return {"status": "ok", "model": settings.doctor_model}


@app.get("/patients")
def list_patients():
    """List patients for the physician panel."""
    try:
        client = get_supabase_client()
        r = (
            client.table("patients")
            .select("id, name, disease_id, diseases(name)")
            .execute()
        )
        rows = r.data or []

        result = []
        for p in rows:
            disease = p.get("diseases") or p.get("disease")
            if isinstance(disease, dict):
                condition = disease.get("name", "Unknown")
            elif isinstance(disease, list) and disease:
                condition = disease[0].get("name", "Unknown") if isinstance(disease[0], dict) else "Unknown"
            elif p.get("disease_id"):
                dr = client.table("diseases").select("name").eq("id", p["disease_id"]).maybe_single().execute()
                condition = dr.data.get("name", "Unknown") if dr.data else "Unknown"
            else:
                condition = "Unknown"

            apt_r = (
                client.table("appointments")
                .select("scheduled_at")
                .eq("patient_id", p["id"])
                .order("scheduled_at", desc=True)
                .limit(1)
                .execute()
            )
            last_apt = (apt_r.data or [{}])[0].get("scheduled_at", "")
            if last_apt:
                try:
                    dt = datetime.fromisoformat(str(last_apt).replace("Z", "+00:00"))
                    last_visit = dt.strftime("%b %d")
                except (ValueError, TypeError):
                    last_visit = str(last_apt)[:10]
            else:
                last_visit = "N/A"

            # Check for recent high-severity symptoms (alert)
            sl_r = (
                client.table("symptom_logs")
                .select("severity")
                .eq("patient_id", p["id"])
                .order("logged_at", desc=True)
                .limit(5)
                .execute()
            )
            sevs = [s.get("severity", 0) or 0 for s in (sl_r.data or [])]
            max_sev = max(sevs) if sevs else 0
            severity = "High" if max_sev >= 7 else ("Moderate" if max_sev >= 5 else "Low")
            alert = max_sev >= 6

            result.append({
                "id": p["id"],
                "name": p["name"],
                "condition": condition,
                "lastVisit": last_visit,
                "severity": severity,
                "alert": alert,
            })
        return {"patients": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/patients/{patient_id}/dashboard")
def get_patient_dashboard(patient_id: str):
    """Dashboard metrics and chart data (no LLM)."""
    try:
        data = get_dashboard_data(patient_id)
        raw = data.get("raw", {})
        return {
            "patient": data["patient"],
            "insights": data["insights"],
            "adherence_by_week": data["adherence_by_week"],
            "symptom_severity_trend": data["symptom_severity_trend"],
            "symptom_names": data.get("symptom_names", []),
            "flare_days_by_week": data["flare_days_by_week"],
            "symptom_frequency_by_week": data["symptom_frequency_by_week"],
            "history": {
                "symptom_logs": raw.get("symptom_logs", []),
                "adherence": raw.get("adherence", []),
                "appointments": raw.get("appointments", []),
                "calendar": raw.get("calendar", []),
                "medications": raw.get("medications", []),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/patients/{patient_id}/summary")
def get_patient_summary(patient_id: str):
    """AI-generated clinical summary."""
    try:
        chain = build_doctor_chain(patient_id=patient_id, streaming=False)
        answer = chain.invoke(SUMMARY_PROMPT)
        return {"summary": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/patients/{patient_id}/interpretation")
def get_patient_interpretation(patient_id: str):
    """Plain-English interpretation of recent data."""
    try:
        chain = build_doctor_chain(patient_id=patient_id, streaming=False)
        answer = chain.invoke(INTERPRETATION_PROMPT)
        return {"interpretation": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AdherenceRequest(BaseModel):
    medication_id: str
    taken: bool = True


@app.post("/patients/{patient_id}/adherence")
def log_medication_adherence(patient_id: str, body: AdherenceRequest):
    """Mark a medication as taken or not taken for today."""
    try:
        client = get_supabase_client()
        medication_id = body.medication_id
        taken = body.taken
        mr = client.table("medications").select("id").eq("patient_id", patient_id).eq("id", medication_id).maybe_single().execute()
        if not mr.data:
            raise HTTPException(status_code=404, detail="Medication not found for this patient")
        today = datetime.utcnow().date().isoformat()
        existing = (
            client.table("medication_adherence_logs")
            .select("id")
            .eq("medication_id", medication_id)
            .eq("logged_date", today)
            .execute()
        )
        if existing.data and len(existing.data) > 0:
            client.table("medication_adherence_logs").update({"taken": taken}).eq("id", existing.data[0]["id"]).execute()
        else:
            client.table("medication_adherence_logs").insert({
                "medication_id": medication_id,
                "logged_date": today,
                "taken": taken,
                "notes": None,
            }).execute()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/patients/{patient_id}/symptom-logs")
def log_symptoms(patient_id: str, request: SymptomLogRequest):
    """Patient self-reports symptom severity. Looks up or creates symptom for patient's disease."""
    try:
        client = get_supabase_client()
        r = client.table("patients").select("id, disease_id").eq("id", patient_id).maybe_single().execute()
        if not r.data:
            raise HTTPException(status_code=404, detail="Patient not found")
        disease_id = r.data.get("disease_id")
        if not disease_id:
            raise HTTPException(status_code=400, detail="Patient has no disease")

        from datetime import datetime
        now = datetime.utcnow().isoformat() + "Z"
        inserted = 0

        symr = client.table("symptoms").select("id, name").eq("disease_id", disease_id).execute()
        existing = {s["name"].lower(): s["id"] for s in (symr.data or [])}

        for entry in request.entries:
            if not entry.symptom_name or entry.severity < 1 or entry.severity > 10:
                continue
            name = entry.symptom_name.strip()
            symptom_id = existing.get(name.lower())
            if not symptom_id:
                ins = client.table("symptoms").insert({"disease_id": disease_id, "name": name}).execute()
                symptom_id = (ins.data or [{}])[0].get("id") if ins.data else None
                if symptom_id:
                    existing[name.lower()] = symptom_id
            if symptom_id:
                client.table("symptom_logs").insert({
                    "patient_id": patient_id,
                    "symptom_id": symptom_id,
                    "logged_at": now,
                    "severity": entry.severity,
                    "notes": entry.notes or None,
                    "curated_by": None,
                }).execute()
                inserted += 1
        return {"ok": True, "inserted": inserted}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Run the physician RAG chain for a clinical query about a patient."""
    try:
        chain = build_doctor_chain(patient_id=request.patient_id, streaming=False)
        question = request.question + CHAT_PROSE_INSTRUCTION
        answer = chain.invoke(question)
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
