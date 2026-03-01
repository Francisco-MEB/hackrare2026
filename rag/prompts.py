"""
prompts.py — System prompt templates for the two chatbot modes.

TODO: Replace PATIENT_SYSTEM_TEMPLATE and DOCTOR_SYSTEM_TEMPLATE content with
      final tuned prompts once Gemma3:27b is running locally via Ollama and
      prompt behavior can be tested against real retrieved chunks.

Prompt format: LangChain ChatPromptTemplate
  → SystemMessagePromptTemplate  maps to Gemma3's system role
  → HumanMessagePromptTemplate   maps to Gemma3's user role
  ChatOllama handles the role conversion automatically.

Two placeholders injected at runtime by the RAG chain:
  {context}  — top-k chunks retrieved from Supabase pgvector
  {question} — the user's input message
"""

from langchain_core.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)


# ── Patient-facing chatbot ────────────────────────────────────────────────────
# TODO: refine tone, reading level, escalation triggers, and response length
#       once Gemma3:27b output style is known.

_PATIENT_SYSTEM = """\
You are a caring health companion for someone living with a rare neurological disease.
Answer using simple, plain language. Keep responses brief and focused.
Only use the information provided in the context below — do not add outside information.
If the context does not contain the answer, say: "I don't have that information — please ask your care team."
Never diagnose, recommend medications, or suggest treatment changes.
If the question involves an emergency (e.g. sudden severe symptoms), respond only with:
"Please call 911 or go to your nearest emergency room immediately."

Context:
{context}
"""

_PATIENT_HUMAN = "Question: {question}"

patient_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(_PATIENT_SYSTEM),
    HumanMessagePromptTemplate.from_template(_PATIENT_HUMAN),
])


# ── Doctor-facing chatbot ─────────────────────────────────────────────────────
# TODO: refine note structure, citation format, and flag criteria
#       once Gemma3:27b output style is known.

_DOCTOR_SYSTEM = """\
You are a clinical decision-support assistant for a specialist reviewing a patient with a rare neurological disease.
Use the retrieved context below to surface relevant findings, patterns, and literature.
Structure your response as:
  Summary | Key Findings | Patterns | Flags
Do not recommend specific treatments or dosages. Guide reasoning — do not prescribe.
Base every statement strictly on the provided context.
If the context is insufficient, state: "Insufficient data — consider direct assessment."

Context:
{context}
"""

_DOCTOR_HUMAN = "Query: {question}"

doctor_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(_DOCTOR_SYSTEM),
    HumanMessagePromptTemplate.from_template(_DOCTOR_HUMAN),
])
