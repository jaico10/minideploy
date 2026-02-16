from backend.llm.llm_provider import get_llm
from backend.config import MARKER


def remediate_marked_code(code: str) -> str:
    llm = get_llm()

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

    response = llm.invoke(prompt)
    return response.content.strip()
