"""
llm.py — Gemma3:27b language model via Ollama.

Why Ollama + local model?
  - No API key needed for development/demo
  - Patient data stays on-device (HIPAA-relevant for production considerations)
  - Gemma3:27b has strong instruction-following and handles structured output well

Key parameter choices:
  temperature=0.1  → near-deterministic; medical answers should be consistent, not creative
  num_ctx=8192     → context window; must fit system prompt + top-k chunks + question
                     (nomic-embed-text chunks are ~800 chars ≈ 200 tokens each;
                      5 chunks ≈ 1000 tokens + overhead → 8192 is safely large)
  num_predict=512  → caps response length; keeps doctor notes concise, patient answers short

Pre-requisites (run once):
  ollama pull gemma3:27b
  ollama pull nomic-embed-text

Note: On first call Ollama will load the model weights into VRAM (~20 GB for 27B).
Subsequent calls reuse the loaded model instantly.
"""

from functools import lru_cache
from langchain_ollama import ChatOllama
from langchain_core.language_models import BaseChatModel

from .config import settings


@lru_cache(maxsize=1)
def get_llm(streaming: bool = False) -> BaseChatModel:
    """
    Return a cached Gemma3:27b chat model instance.

    Args:
        streaming: If True, enables token-by-token streaming so the UI can
                   display partial responses immediately.  Use streaming=True
                   in the API route handlers for responsive UX.
    """
    return ChatOllama(
        model=settings.ollama_llm_model,
        base_url=settings.ollama_base_url,
        temperature=0.1,
        num_ctx=8192,
        num_predict=512,
        streaming=streaming,
        # Keep model loaded in memory between requests (no cold-start penalty)
        keep_alive="10m",
    )


def get_streaming_llm() -> BaseChatModel:
    """Convenience wrapper — returns the streaming-enabled LLM instance."""
    # lru_cache keyed on streaming=True separately from streaming=False
    return get_llm(streaming=True)
