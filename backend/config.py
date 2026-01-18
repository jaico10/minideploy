import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
MARKER = os.getenv("MARKER", "CodeSentinnel7219834THISISANERROR")
