from langchain_groq import ChatGroq
from backend.config import GROQ_API_KEY

llm = ChatGroq(
    api_key=GROQ_API_KEY,
    model="llama3-70b-8192",
    temperature=0
)

def call_llm(prompt: str) -> str:
    return llm.invoke(prompt).content
