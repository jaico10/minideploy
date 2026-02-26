from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from backend.core.database import Base, engine, get_db
from backend.api import auth, routes, repositories
from backend.schemas.scan import ScanCreate, ScanOut, DashboardStats
from backend.crud.scan_crud import get_dashboard_stats, list_scans, create_scan
from backend.tasks import scan_repo_task

# ── Auto-create tables on startup (use Alembic in production) ──────────────
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Code Sentinel – Code Security Scanner",
    description="AI-powered SAST scanner using Groq LLaMA3 + GitHub API.",
    version="2.0.0",
)

# ── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(routes.router)
app.include_router(repositories.router)


# ──────────────────────────────────────────────────────────────────────────
# Helper
# ──────────────────────────────────────────────────────────────────────────

def extract_repo_name(url: str) -> str:
    parts = url.rstrip("/").split("/")
    return f"{parts[-2]}/{parts[-1]}" if len(parts) >= 2 else url


# ──────────────────────────────────────────────────────────────────────────
# Health check
# ──────────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "Backend running", "timestamp": datetime.utcnow().isoformat()}
