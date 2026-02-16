from langchain_groq import ChatGroq
from backend.config import GROQ_API_KEY

def get_llm():
    return ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model="llama-3.1-8b-instant",   # ✅ working model
        temperature=0.2
    )
