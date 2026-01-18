from backend.llm.groq_client import call_llm
from backend.config import MARKER

def scan_and_mark_code(code: str) -> str:
    prompt = f"""
You are a Static Application Security Testing (SAST) engine.

RULES (STRICT):
1) Return FULL original code.
2) Output ONLY code (no markdown, no explanation).
3) Only append marker comments at end of vulnerable lines.
4) Marker format exactly:
   # {MARKER} [INJECTION|XSS|CRYPTOGRAPHIC_FAILURE|BROKEN_ACCESS_CONTROL]
5) If no vulnerabilities exist, return unchanged code.

CODE:
{code}
""".strip()

    return call_llm(prompt)
