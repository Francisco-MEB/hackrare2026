"""
chains.py — Assembles the end-to-end RAG pipeline using LangChain LCEL.

Pipeline (both modes):
  user question
    → retriever  (Supabase pgvector top-k similarity search)
    → _format_docs  (chunks → single context string)
    → prompt  (system + context + question → chat messages)
    → LLM  (Gemma3:27b via Ollama)
    → StrOutputParser  (extracts text from chat response)

LCEL (LangChain Expression Language) uses | pipe syntax.
RunnableParallel passes the original question AND retrieved docs
into the prompt simultaneously — required because the retriever
consumes the question but the prompt also needs it as {question}.

Usage from the API layer:
    chain = build_patient_chain(patient_id="uuid-here")
    response = chain.invoke("When was my last flare?")

    # Streaming (for responsive UI):
    async for chunk in chain.astream("What is NMOSD?"):
        send_to_client(chunk)
"""

from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document

from .retriever import get_patient_retriever, get_doctor_retriever
from .llm import get_llm, get_streaming_llm
from .prompts import patient_prompt, doctor_prompt


def _format_docs(docs: list[Document]) -> str:
    """
    Concatenate retrieved chunks into a single context block for the prompt.
    Each chunk is separated by a divider so the LLM can distinguish sources.
    Source metadata (document title, patient_id, date) is prepended per chunk
    so the doctor prompt can cite it.
    """
    sections = []
    for i, doc in enumerate(docs, start=1):
        meta = doc.metadata
        source = meta.get("source", meta.get("title", f"chunk-{i}"))
        date = meta.get("date", "")
        header = f"[{i}] {source}" + (f" ({date})" if date else "")
        sections.append(f"{header}\n{doc.page_content}")
    return "\n\n---\n\n".join(sections) if sections else "No relevant context found."


def build_patient_chain(patient_id: str, streaming: bool = False):
    """
    RAG chain for the patient-facing chatbot.

    Args:
        patient_id: UUID of the logged-in patient — scopes retrieval to their record.
        streaming:  Set True in API routes to enable token-by-token streaming.

    Returns:
        A LangChain Runnable that accepts a question string and returns an answer string.
    """
    retriever = get_patient_retriever(patient_id)
    llm = get_streaming_llm() if streaming else get_llm()

    chain = (
        RunnableParallel({
            "context": retriever | _format_docs,   # retrieve → format chunks
            "question": RunnablePassthrough(),      # pass question through unchanged
        })
        | patient_prompt
        | llm
        | StrOutputParser()
    )
    return chain


def build_doctor_chain(patient_id: str, streaming: bool = False):
    """
    RAG chain for the doctor-facing chatbot.

    Retrieves from both the disease knowledge base and the patient's record
    (handled inside get_doctor_retriever), returning more chunks at higher density.

    Args:
        patient_id: UUID of the patient being reviewed.
        streaming:  Set True in API routes to enable token-by-token streaming.

    Returns:
        A LangChain Runnable that accepts a clinical query string and returns
        a structured SOAP-adjacent note string.
    """
    retriever = get_doctor_retriever(patient_id)
    llm = get_streaming_llm() if streaming else get_llm()

    chain = (
        RunnableParallel({
            "context": retriever | _format_docs,
            "question": RunnablePassthrough(),
        })
        | doctor_prompt
        | llm
        | StrOutputParser()
    )
    return chain
