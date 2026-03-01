"""
prompts.py — RAG context injection templates for the two chatbot models.

Why there are NO system messages here:
  The full system prompts (behavior rules, guardrails, tone, output format) are
  already baked into the Ollama models via Modelfile.doctor and Modelfile.patient.
  Adding a second system message through LangChain would conflict with the
  Modelfile's SYSTEM block.

  Instead, we only inject the RAG context and the question through a single
  HumanMessage.  The model's built-in system prompt handles all behavior;
  we just feed it the retrieved evidence to reason over.

Message structure sent to both models:
  [Modelfile SYSTEM — baked in, always first]
  HumanMessage:
    Retrieved context (top-k chunks from Supabase)
    User question

Placeholders filled at runtime by the RAG chain:
  {context}  — formatted top-k chunks from Supabase pgvector
  {question} — the user's input
"""

from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate


# ── Patient-facing chatbot ────────────────────────────────────────────────────
# The human turn delivers RAG context followed by the patient's question.
# gemma3-patient:latest already knows to answer warmly and briefly —
# we don't need to repeat those instructions here.

_PATIENT_HUMAN = """\
Here is information from your health record and disease knowledge base:

{context}

---
{question}"""

patient_prompt = ChatPromptTemplate.from_messages([
    HumanMessagePromptTemplate.from_template(_PATIENT_HUMAN),
])


# ── Doctor-facing chatbot ─────────────────────────────────────────────────────
# The human turn delivers RAG context followed by the clinical query.
# gemma3-doctor:latest already knows to output structured clinical notes
# with citations and confidence labels — no need to repeat those rules here.

_DOCTOR_HUMAN = """\
Retrieved context (patient record + clinical literature):

{context}

---
{question}"""

doctor_prompt = ChatPromptTemplate.from_messages([
    HumanMessagePromptTemplate.from_template(_DOCTOR_HUMAN),
])
