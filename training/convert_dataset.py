#!/usr/bin/env python3
"""
Convert rare_disease_dataset.json → Gemma 3 SFT training JSONL.

Pipeline:
  1. Field mapping  (question → instruction, answer → output)
  2. Reasoning injection (Option B — prepend CoT before final answer)
  3. NeuraCare style injection
     - Strip prescriptive language
     - Add CONFIDENCE label (from difficulty)
     - Add clinical disclaimer
     - Reformat source citations
  4. Gemma 3 chat template wrapping
  5. Write JSONL with a single `text` field

Outputs:
  gemma3_training.jsonl       — all 9800 records
  gemma3_priority.jsonl       — only NeuraCare priority conditions
"""

import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

INPUT_FILE = Path("rare_disease_dataset.json")
OUTPUT_ALL = Path("gemma3_training.jsonl")
OUTPUT_PRIORITY = Path("gemma3_priority.jsonl")

DISCLAIMER = (
    "Clinical decision support only — not a substitute for professional medical "
    "judgement. Always verify against current clinical guidelines and consult "
    "appropriate specialists before making treatment decisions."
)

# NeuraCare priority condition keywords (case-insensitive)
PRIORITY_KEYWORDS = [
    "myasthenia gravis", r"\bMG\b",
    r"\bALS\b", "amyotrophic lateral sclerosis",
    "dravet",
    r"\bCIDP\b", "chronic inflammatory demyelinating",
    r"\bNMOSD\b", "neuromyelitis optica",
]
PRIORITY_PATTERN = re.compile(
    "|".join(PRIORITY_KEYWORDS), re.IGNORECASE
)

# Prescriptive → NeuraCare-safe replacements (order matters — longer phrases first)
PRESCRIPTIVE_REPLACEMENTS = [
    (r"\bI strongly recommend\b",        "evidence strongly suggests"),
    (r"\bI recommend\b",                 "evidence suggests"),
    (r"\bI suggest\b",                   "evidence suggests"),
    (r"\byou should\b",                  "guidelines indicate"),
    (r"\bshould be\b",                   "guidelines indicate"),
    (r"\bmust be\b",                     "evidence suggests"),
    (r"\bshould\b",                      "guidelines indicate"),
    (r"\bmust\b",                        "evidence suggests"),
    (r"\bit is essential to\b",          "evidence suggests"),
    (r"\bit is necessary to\b",          "guidelines indicate"),
    (r"\bpatients need to\b",            "patients may consider"),
    (r"\bpatients must\b",               "patients may"),
    (r"\bpatients should\b",             "patients may"),
]

# Source citation pattern: look for parenthetical refs like (Smith et al., 2020)
# or inline refs like "according to the 2021 guidelines"
CITATION_INLINE = re.compile(
    r'\(([A-Z][^)]*?\d{4}[^)]*?)\)',   # (Author et al., Year) style
)
CITATION_GUIDELINE = re.compile(
    r'(?:according to|per|based on)\s+(?:the\s+)?(\d{4}\s+\w[^,.]+(?:guidelines?|criteria|consensus|statement|protocol))',
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def difficulty_to_confidence(difficulty) -> str:
    if difficulty in (2, 3):
        return "HIGH"
    if difficulty in (4, 5):
        return "MODERATE"
    return "MODERATE"  # None / missing


def strip_prescriptive(text: str) -> str:
    for pattern, replacement in PRESCRIPTIVE_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def reformat_citations(text: str) -> str:
    """Wrap detected citations in [Source: ...] markers."""
    def fmt_parens(m):
        return f"[Source: {m.group(1).strip()}]"

    def fmt_guideline(m):
        return f"[Source: {m.group(1).strip()}]"

    text = CITATION_INLINE.sub(fmt_parens, text)
    text = CITATION_GUIDELINE.sub(
        lambda m: m.group(0).replace(m.group(1), f"[Source: {m.group(1).strip()}]"),
        text,
    )
    return text


def inject_neuracare_style(answer: str, difficulty) -> str:
    answer = strip_prescriptive(answer)
    answer = reformat_citations(answer)

    confidence = difficulty_to_confidence(difficulty)
    answer = answer.rstrip()
    answer += f"\n\nCONFIDENCE: {confidence}\n\n{DISCLAIMER}"
    return answer


def build_output_with_reasoning(reasoning: str | None, answer: str) -> str:
    if reasoning:
        cleaned_reasoning = strip_prescriptive(reasoning.strip())
        return f"Reasoning:\n{cleaned_reasoning}\n\nResponse:\n{answer.strip()}"
    return answer.strip()


def to_gemma3_text(question: str, output: str) -> str:
    """
    Wrap into Gemma 3 chat template:
      <start_of_turn>user
      {question}<end_of_turn>
      <start_of_turn>model
      {output}<end_of_turn>
    """
    return (
        f"<start_of_turn>user\n{question.strip()}<end_of_turn>\n"
        f"<start_of_turn>model\n{output.strip()}<end_of_turn>"
    )


def is_priority(record: dict) -> bool:
    combined = record.get("question", "") + " " + record.get("metadata", {}).get("topic", "")
    return bool(PRIORITY_PATTERN.search(combined))


def convert_record(record: dict) -> dict:
    question  = record["question"]
    answer    = record["answer"]
    metadata  = record.get("metadata", {})
    reasoning = metadata.get("reasoning")
    difficulty = metadata.get("difficulty")

    styled_answer = inject_neuracare_style(answer, difficulty)
    full_output   = build_output_with_reasoning(reasoning, styled_answer)
    text          = to_gemma3_text(question, full_output)

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

    print(f"Converting {len(data)} records...")

    all_count = 0
    priority_count = 0

    with OUTPUT_ALL.open("w") as f_all, OUTPUT_PRIORITY.open("w") as f_pri:
        for record in data:
            converted = convert_record(record)
            line = json.dumps(converted, ensure_ascii=False)

            f_all.write(line + "\n")
            all_count += 1

            if is_priority(record):
                f_pri.write(line + "\n")
                priority_count += 1

    print(f"\nDone.")
    print(f"  {OUTPUT_ALL}       — {all_count} records")
    print(f"  {OUTPUT_PRIORITY}   — {priority_count} priority records")

    # Show a sample
    print("\n--- Sample output (first record) ---")
    with OUTPUT_ALL.open() as f:
        sample = json.loads(f.readline())
    print(sample["text"][:800])
    print("...")


if __name__ == "__main__":
    main()
