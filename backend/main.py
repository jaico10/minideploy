from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import json

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
cors_origins_raw = os.getenv("CORS_ORIGINS", '["http://localhost:5173", "http://127.0.0.1:5173"]')
try:
    allow_origins = json.loads(cors_origins_raw)
except Exception:
    allow_origins = [cors_origins_raw]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
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
