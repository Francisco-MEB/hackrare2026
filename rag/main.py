import asyncio
from .ingest import ingest_documents
from .chains import build_doctor_chain
from .patient_context import build_and_ingest_patient_context
from .config import settings

JOHN_HARVARD_PATIENT_ID = "b2c3d4e5-0000-0000-0000-000000000001"

HUNTINGTONS_KNOWLEDGE = """
Huntington's Disease (HD) is a rare, inherited neurodegenerative disorder caused by a
CAG trinucleotide repeat expansion in the HTT gene. It affects movement, cognition,
and psychiatric function. Symptoms typically develop in mid-adulthood (30s-40s) and
progress over 15-20 years.

Key symptoms include chorea (involuntary movements), muscle spasms, cognitive decline,
depression, anxiety, and insomnia. Motor symptoms often include rigidity, bradykinesia,
and dystonia in addition to chorea.

Treatment focuses on symptom management. Tetrabenazine, deutetrabenazine, and
valbenazine are VMAT2 inhibitors used to reduce chorea and movement symptoms.
These medications have shown efficacy for chorea and muscle spasm in clinical practice.
Adherence is critical — missed doses can worsen symptom control.

Physical therapy, speech therapy, and psychological support are important adjuncts.
Regular monitoring and multidisciplinary care improve quality of life.
"""

async def run_demo():
    print("=" * 60)
    print("HackRare 2026 — Physician Chatbot Demo")
    print("Patient: John Harvard | Disease: Huntington's")
    print("=" * 60)
    print(f"Doctor LLM : {settings.doctor_model}")
    print(f"Embed model: {settings.ollama_embed_model}")
    print(f"Supabase   : {settings.supabase_url}")
    print("=" * 60)

    # Step 1: Ingestion 
    print("\n[1/3] Ingesting Huntington's Disease knowledge...")
    n = ingest_documents(HUNTINGTONS_KNOWLEDGE, doc_type="disease-overview")
    print(f"      → {n} chunk(s) stored in '{settings.documents_table}'")

    # Step 2: Build and ingest John Harvard's full patient context 
    print(f"\n[2/3] Fetching John Harvard's data from DB and ingesting into RAG...")
    n = build_and_ingest_patient_context(JOHN_HARVARD_PATIENT_ID, date="2026-02-28")
    print(f"      → {n} chunk(s) stored in '{settings.patient_records_table}'")

    # Step 3: Physician chatbot query 
    print("\n[3/3] Physician chatbot query...")

    doctor_question = (
        '''
        You are assisting Dr. Brigham (the treating physician) in caring for this patient.
        Summarize this patient's current status: medications, adherence, 
        recent symptom logs, and upcoming appointments. Suggest any clinical 
        considerations or treatments that have worked for similar patients.
        '''
    )    

    print(f"      Q: {doctor_question}")
    doctor_chain = build_doctor_chain(patient_id=JOHN_HARVARD_PATIENT_ID)
    doctor_answer = doctor_chain.invoke(doctor_question)
    print(f"\n      Physician chatbot response:\n{doctor_answer}")

    print("\n" + "=" * 60)
    print("Demo complete.")


if __name__ == "__main__":
    asyncio.run(run_demo())
