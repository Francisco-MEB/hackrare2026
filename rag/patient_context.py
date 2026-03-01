from datetime import datetime
from .vectorstore import get_supabase_client
from .ingest import ingest_patient_entry


def _format_patient_context(data: dict) -> str:
    lines = []
 
    if data.get("patient"):
        p = data["patient"]
        lines.append(f"## Patient: {p.get('name', 'N/A')}")
        if data.get("disease"):
            lines.append(f"Disease: {data['disease'].get('name', 'N/A')}")
        lines.append("")

    if data.get("medications"):
        lines.append("## Current Medications")
        for m in data["medications"]:
            sym = m.get("symptoms")
            if isinstance(sym, list) and sym:
                sym_name = sym[0].get("name", "N/A")
            elif isinstance(sym, dict):
                sym_name = sym.get("name", "N/A")
            else:
                sym_name = "N/A"
            lines.append(f"- {m.get('name', 'N/A')} {m.get('dosage', '')} {m.get('frequency', '')} (for {sym_name})")
        lines.append("")

    if data.get("adherence"):
        lines.append("## Medication Adherence (recent)")
        for a in data["adherence"][:14]:  # last 14 days
            status = "taken" if a.get("taken") else "missed"
            note = f" — {a['notes']}" if a.get("notes") else ""
            lines.append(f"- {a.get('logged_date')}: {status}{note}")
        lines.append("")

    if data.get("appointments"):
        lines.append("## Appointments")
        for apt in data["appointments"]:
            scheduled = apt.get("scheduled_at", "")[:16] if apt.get("scheduled_at") else "N/A"
            lines.append(f"- {scheduled} | {apt.get('physician', '')} | {apt.get('visit_type', '')} | {apt.get('notes') or ''}")
        lines.append("")

    if data.get("symptom_logs"):
        lines.append("## Symptom Logs (patient-reported, curated by doctor)")
        for sl in data["symptom_logs"]:
            sym = sl.get("symptoms")
            if isinstance(sym, list) and sym:
                sym_name = sym[0].get("name", "N/A")
            elif isinstance(sym, dict):
                sym_name = sym.get("name", "N/A")
            else:
                sym_name = "N/A"
            logged = sl.get("logged_at", "")[:16] if sl.get("logged_at") else "N/A"
            sev = sl.get("severity", "N/A")
            note = f" — {sl['notes']}" if sl.get("notes") else ""
            curated = f" (curated by {sl['curated_by']})" if sl.get("curated_by") else ""
            lines.append(f"- {logged} | {sym_name} | severity {sev}{note}{curated}")
        lines.append("")
 
    if data.get("calendar"):
        lines.append("## Calendar / Schedule")
        for ev in data["calendar"]:
            ev_at = ev.get("event_at", "")[:16] if ev.get("event_at") else "N/A"
            lines.append(f"- {ev_at} | {ev.get('title', '')} | {ev.get('event_type', '')} | {ev.get('description') or ''}")
        lines.append("")

    if data.get("treatments"):
        lines.append("## Evidence-Based Treatments (worked for similar patients)")
        for t in data["treatments"]:
            sym = t.get("symptoms")
            if isinstance(sym, list) and sym:
                sym_name = sym[0].get("name", "N/A")
            elif isinstance(sym, dict):
                sym_name = sym.get("name", "N/A")
            else:
                sym_name = "N/A"
            lines.append(f"- {t.get('treatment', '')} by {t.get('physician', '')} for {sym_name} (worked: {t.get('worked', True)})")

    return "\n".join(lines) if lines else "No patient data found."


def fetch_patient_data(patient_id: str) -> dict:
    client = get_supabase_client()
    data = {"patient": None, "disease": None, "medications": [], "adherence": [], "appointments": [], "symptom_logs": [], "calendar": [], "treatments": []}

    r = client.table("patients").select("id, name, disease_id").eq("id", patient_id).maybe_single().execute()
    if r.data:
        data["patient"] = r.data
        disease_id = r.data.get("disease_id")
        if disease_id:
            dr = client.table("diseases").select("id, name").eq("id", disease_id).maybe_single().execute()
            if dr.data:
                data["disease"] = dr.data

    mr = client.table("medications").select("id, name, dosage, frequency, symptom_id, symptoms(name)").eq("patient_id", patient_id).execute()
    data["medications"] = mr.data or []

    med_ids = [m["id"] for m in data["medications"]]
    if med_ids:
        ar = client.table("medication_adherence_logs").select("logged_date, taken, notes, medications(name)").in_("medication_id", med_ids).order("logged_date", desc=True).execute()
        data["adherence"] = ar.data or []

    apr = client.table("appointments").select("scheduled_at, physician, visit_type, notes").eq("patient_id", patient_id).order("scheduled_at").execute()
    data["appointments"] = apr.data or []

    slr = client.table("symptom_logs").select("logged_at, severity, notes, curated_by, symptoms(name)").eq("patient_id", patient_id).order("logged_at", desc=True).execute()
    data["symptom_logs"] = slr.data or []

    cr = client.table("calendar_events").select("event_at, title, description, event_type").eq("patient_id", patient_id).order("event_at").execute()
    data["calendar"] = cr.data or []

    if data.get("disease"):
        disease_name = data["disease"].get("name", "")
        symr = client.table("symptoms").select("id").eq("disease_id", data["disease"]["id"]).execute()
        symptom_ids = [s["id"] for s in (symr.data or [])]
        if symptom_ids:
            tr = client.table("treatments").select("physician, treatment, worked, symptoms(name)").in_("symptom_id", symptom_ids).eq("worked", True).limit(10).execute()
            data["treatments"] = tr.data or []

    return data


def build_and_ingest_patient_context(patient_id: str, date: str | None = None) -> int:
    data = fetch_patient_data(patient_id)
    text = _format_patient_context(data)
    return ingest_patient_entry(
        user_id=patient_id,
        content=text,
        doc_type="patient_summary",
        date=date or datetime.utcnow().date().isoformat(),
        extra_metadata={"source": "patient-context", "patient_name": data.get("patient", {}).get("name", "Unknown")},
    )
