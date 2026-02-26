from backend.llm.llm_provider import get_llm
from backend.config import MARKER

def scan_and_mark_code(code: str, file_path: str = "") -> str:
    llm = get_llm()

    prompt = f"""
You are a Static Application Security Testing (SAST) engine.

RULES (STRICT):
1) Return FULL original code.
2) Output ONLY code (no markdown, no explanation).
3) Only append marker comments at end of vulnerable lines.
4) Marker format exactly:
   # {MARKER} [INJECTION|XSS|CRYPTOGRAPHIC_FAILURE|BROKEN_ACCESS_CONTROL]
5) If no vulnerabilities exist, return unchanged code.

FILE: {file_path}

CODE:
{code}
""".strip()

    response = llm.invoke(prompt)
    return response.content.strip()
