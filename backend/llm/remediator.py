from backend.llm.groq_client import call_llm
from backend.config import MARKER

def remediate_marked_code(code: str) -> str:
    prompt = f"""
You are a Security Remediation Engine.

RULES (STRICT):
1) Fix only lines containing: # {MARKER}
2) Remove the marker completely and append #FIXED at end of corrected line.
3) Leave all other lines EXACTLY unchanged unless required for correctness.
4) Output ONLY the corrected code.

CODE:
{code}
""".strip()

    return call_llm(prompt)
