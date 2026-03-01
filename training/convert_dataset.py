#!/usr/bin/env python3
"""
Convert rare_disease_dataset.json → Gemma 3 SFT training JSONL.

Pipeline:
  1. Drop records with no reasoning — they have nothing to teach
  2. Field mapping (question → user turn)
  3. Build model output:
       Reasoning: {CoT from metadata.reasoning}
       Response:  {full answer from database, non-prescriptive}
       CONFIDENCE: HIGH | MODERATE
       {disclaimer}
  4. NeuraCare style injection on both reasoning and response:
       - Strip prescriptive language
       - Reformat source citations
  5. Gemma 3 chat template wrapping
  6. Write JSONL with a single `text` field

Output:
  gemma3_training.jsonl  — records with reasoning only
"""

import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

INPUT_FILE  = Path("neurological-conditions-queries.json")
OUTPUT_FILE = Path("gemma3_training.jsonl")

DISCLAIMER = (
    "Clinical decision support only — not a substitute for professional medical "
    "judgement. Always verify against current clinical guidelines and consult "
    "appropriate specialists before making treatment decisions."
)

# ---------------------------------------------------------------------------
# NeuraCare style rules
# ---------------------------------------------------------------------------

# Prescriptive → evidence-based replacements (longer phrases first)
PRESCRIPTIVE_REPLACEMENTS = [
    (r"\bI strongly recommend\b",   "evidence strongly suggests"),
    (r"\bI recommend\b",            "evidence suggests"),
    (r"\bI suggest\b",              "evidence suggests"),
    (r"\byou should\b",             "guidelines indicate"),
    (r"\bshould be\b",              "guidelines indicate"),
    (r"\bmust be\b",                "evidence suggests"),
    (r"\bshould\b",                 "guidelines indicate"),
    (r"\bmust\b",                   "evidence suggests"),
    (r"\bit is essential to\b",     "evidence suggests"),
    (r"\bit is necessary to\b",     "guidelines indicate"),
    (r"\bpatients need to\b",       "patients may consider"),
    (r"\bpatients must\b",          "patients may"),
    (r"\bpatients should\b",        "patients may"),
]

# Citation patterns
CITATION_INLINE = re.compile(r'\(([A-Z][^)]*?\d{4}[^)]*?)\)')
CITATION_GUIDELINE = re.compile(
    r'(?:according to|per|based on)\s+(?:the\s+)?'
    r'(\d{4}\s+\w[^,.]+(?:guidelines?|criteria|consensus|statement|protocol))',
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def difficulty_to_confidence(difficulty) -> str:
    if difficulty in (2, 3):
        return "HIGH"
    return "MODERATE"  # covers 4, 5, and None


def strip_prescriptive(text: str) -> str:
    for pattern, replacement in PRESCRIPTIVE_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def reformat_citations(text: str) -> str:
    text = CITATION_INLINE.sub(
        lambda m: f"[Source: {m.group(1).strip()}]", text
    )
    text = CITATION_GUIDELINE.sub(
        lambda m: m.group(0).replace(
            m.group(1), f"[Source: {m.group(1).strip()}]"
        ),
        text,
    )
    return text


def build_model_output(reasoning: str, answer: str, difficulty) -> str:
    """
    Compose the full model turn:
      Reasoning: {cleaned CoT from metadata.reasoning}
      Response:  {full answer from DB, style-cleaned}
      CONFIDENCE: HIGH | MODERATE
      {disclaimer}
    """
    clean_reasoning = strip_prescriptive(reformat_citations(reasoning.strip()))
    clean_response  = strip_prescriptive(reformat_citations(answer.strip()))
    confidence      = difficulty_to_confidence(difficulty)

    return (
        f"Reasoning:\n{clean_reasoning}\n\n"
        f"Response:\n{clean_response}\n\n"
        f"CONFIDENCE: {confidence}\n"
        f"{DISCLAIMER}"
    )


def to_gemma3_text(question: str, model_output: str) -> str:
    return (
        f"<start_of_turn>user\n{question.strip()}<end_of_turn>\n"
        f"<start_of_turn>model\n{model_output.strip()}<end_of_turn>"
    )


def convert_record(record: dict) -> dict | None:
    metadata  = record.get("metadata", {})
    reasoning = metadata.get("reasoning")

    # Drop records with no reasoning — nothing to teach
    if not reasoning or not reasoning.strip():
        return None

    question   = record["question"]
    answer     = record["answer"]
    difficulty = metadata.get("difficulty")

    model_output = build_model_output(reasoning, answer, difficulty)
    text = to_gemma3_text(question, model_output)

    return {"text": text}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not INPUT_FILE.exists():
        print(f"ERROR: {INPUT_FILE} not found.", file=sys.stderr)
        sys.exit(1)

    print(f"Loading {INPUT_FILE}...")
    with INPUT_FILE.open() as f:
        data = json.load(f)

    print(f"Processing {len(data)} records...")

    written   = 0
    dropped   = 0

    with OUTPUT_FILE.open("w") as out:
        for record in data:
            converted = convert_record(record)
            if converted is None:
                dropped += 1
                continue
            out.write(json.dumps(converted, ensure_ascii=False) + "\n")
            written += 1

    print(f"\nDone.")
    print(f"  Written : {written}")
    print(f"  Dropped (no reasoning): {dropped}")
    print(f"  Output  : {OUTPUT_FILE}")

    # Validation pass
    print("\nRunning validation...")
    issues = 0
    with OUTPUT_FILE.open() as f:
        for i, line in enumerate(f):
            r = json.loads(line)
            t = r["text"]
            for marker in ["<start_of_turn>user", "<start_of_turn>model",
                           "<end_of_turn>", "Reasoning:",
                           "Response:", "CONFIDENCE:"]:
                if marker not in t:
                    print(f"  Record {i}: missing '{marker}'")
                    issues += 1
    print(f"  Issues found: {issues}")

    # Sample output
    print("\n--- Sample output ---")
    with OUTPUT_FILE.open() as f:
        sample = json.loads(f.readline())
    print(sample["text"][:1000])
    print("...")


if __name__ == "__main__":
    main()
