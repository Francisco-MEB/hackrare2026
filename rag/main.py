"""
main.py — End-to-end smoke test / demo for the RAG pipeline.

Run once Ollama is running and Supabase credentials are set in .env:
    python -m rag.main

What this does:
  1. Ingests a sample disease knowledge document into the shared knowledge base
  2. Ingests a sample patient symptom log under a test user_id
  3. Runs the patient chatbot chain and prints the response
  4. Runs the doctor chatbot chain and prints the response

This is NOT production code — it is a validation harness to confirm the full
pipeline (embed → store → retrieve → LLM → output) is working before the
webapp API layer is connected.

TODO: Remove or gate behind APP_ENV=development before production deployment.
"""

import asyncio
from .ingest import ingest_documents, ingest_patient_entry
from .chains import build_patient_chain, build_doctor_chain
from .config import settings


# ── Sample data ───────────────────────────────────────────────────────────────

SAMPLE_KNOWLEDGE = """
Neuromyelitis Optica Spectrum Disorder (NMOSD) is a rare autoimmune disease
of the central nervous system that primarily attacks the optic nerves and spinal cord.
It is characterized by relapsing attacks of optic neuritis and transverse myelitis.
Flares are often triggered by infections, physical stress, or medication non-adherence.
Common symptoms include vision loss, limb weakness, numbness, and bladder dysfunction.
Early aggressive immunosuppressive therapy is associated with reduced relapse rates.
"""

SAMPLE_SYMPTOM_LOG = {
    "pain_level": "7/10 — lower back and right leg",
    "fatigue": "severe — unable to complete morning routine",
    "vision": "blurry in left eye, worsened since yesterday",
    "mobility": "walking with difficulty, needed cane",
    "sleep": "5 hours, interrupted",
    "notes": "Possible early flare — symptoms started 2 days ago after viral infection",
    "medications_taken": "Azathioprine 150mg (morning), skipped evening dose",
}

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"   # placeholder UUID for demo


async def run_demo():
    print("=" * 60)
    print("HackRare 2026 — RAG Pipeline Demo")
    print(f"LLM model  : {settings.ollama_llm_model}")
    print(f"Embed model: {settings.ollama_embed_model}")
    print(f"Supabase   : {settings.supabase_url}")
    print("=" * 60)

    # ── Step 1: Ingest sample knowledge ──────────────────────────────────────
    print("\n[1/4] Ingesting disease knowledge document...")
    n = ingest_documents(SAMPLE_KNOWLEDGE, doc_type="disease-overview")
    print(f"      → {n} chunk(s) stored in '{settings.documents_table}'")

    # ── Step 2: Ingest sample patient symptom log ─────────────────────────────
    print(f"\n[2/4] Ingesting patient symptom log for user_id={TEST_USER_ID}...")
    n = ingest_patient_entry(
        user_id=TEST_USER_ID,
        content=SAMPLE_SYMPTOM_LOG,
        doc_type="symptom_log",
        date="2026-02-28",
        extra_metadata={"disease": "NMOSD"},
    )
    print(f"      → {n} chunk(s) stored in '{settings.patient_records_table}'")

    # ── Step 3: Patient chain query ───────────────────────────────────────────
    print("\n[3/4] Patient chain query...")
    patient_question = "How am I doing compared to my last symptom log?"
    print(f"      Q: {patient_question}")
    patient_chain = build_patient_chain(patient_id=TEST_USER_ID)
    patient_answer = patient_chain.invoke(patient_question)
    print(f"\n      Patient chatbot response:\n{patient_answer}")

    # ── Step 4: Doctor chain query ────────────────────────────────────────────
    print("\n[4/4] Doctor chain query...")
    doctor_question = "Summarise this patient's current symptom picture and flag any patterns."
    print(f"      Q: {doctor_question}")
    doctor_chain = build_doctor_chain(patient_id=TEST_USER_ID)
    doctor_answer = doctor_chain.invoke(doctor_question)
    print(f"\n      Doctor chatbot response:\n{doctor_answer}")

    print("\n" + "=" * 60)
    print("Demo complete.")


if __name__ == "__main__":
    asyncio.run(run_demo())
