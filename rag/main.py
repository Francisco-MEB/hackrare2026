import asyncio
from .chains import build_doctor_chain
from .patient_context import build_and_ingest_patient_context
from .config import settings

JOHN_HARVARD_PATIENT_ID = "b2c3d4e5-0000-0000-0000-000000000001"


async def run_demo():
    print("=" * 60)
    print("HackRare 2026 — Physician Chatbot Demo")
    print("Patient: John Harvard | Disease: Huntington's")
    print("=" * 60)
    print(f"Doctor LLM : {settings.doctor_model}")
    print(f"Embed model: {settings.ollama_embed_model}")
    print(f"Supabase   : {settings.supabase_url}")
    print("=" * 60)

    # Step 1: Build and ingest John Harvard's full patient context
    print("\n[1/2] Fetching John Harvard's data from DB and ingesting into RAG...")
    n = build_and_ingest_patient_context(JOHN_HARVARD_PATIENT_ID, date="2026-02-28")
    print(f"      → {n} chunk(s) stored in '{settings.patient_records_table}'")

    # Step 2: Physician chatbot query
    print("\n[2/2] Physician chatbot query...")

    doctor_question = (
        '''
        I am Dr. Kim (the treating physician), and you will assist me in caring for this patient.
        Summarize this patient's current status in a manner formatted like (1), (2), (3), ...: medications, adherence, 
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
