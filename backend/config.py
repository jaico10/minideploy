import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY   = os.getenv("GROQ_API_KEY")
GITHUB_TOKEN   = os.getenv("GITHUB_TOKEN")
REDIS_URL      = os.getenv("REDIS_URL", "redis://localhost:6379/0")
MARKER         = os.getenv("MARKER", "CodeSentinnel7219834THISISANERROR")
GROQ_MODEL     = os.getenv("GROQ_MODEL", "llama3-70b-8192")
DATABASE_URL   = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/minilang_db")
FRONTEND_URL   = os.getenv("FRONTEND_URL", "http://localhost:5173")
CORS_ORIGINS   = os.getenv("CORS_ORIGINS", '["*"]')
