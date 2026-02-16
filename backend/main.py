from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from celery.result import AsyncResult
from datetime import datetime
from typing import List, Optional

from backend.tasks import scan_repo_task
from backend.celery_app import celery_app

app = FastAPI(title="RepoGuardAI - Background Scanner")

# ✅ Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RepoRequest(BaseModel):
    repo_url: str


# In-memory storage for scanning sessions (replace with database later)
scan_sessions = {}


# Helper to extract repo name from URL
def extract_repo_name(url: str) -> str:
    parts = url.rstrip("/").split("/")
    return f"{parts[-2]}/{parts[-1]}" if len(parts) >= 2 else url


# Helper to calculate severity from issues
def calculate_severity(issue_count: int) -> str:
    if issue_count >= 10:
        return "Critical"
    elif issue_count >= 5:
        return "High"
    elif issue_count > 0:
        return "Medium"
    return "Low"


# Helper to calculate risk score
def calculate_risk_score(results: dict) -> float:
    if not results or "results" not in results:
        return 0.0
    
    vulnerable_files = sum(1 for r in results["results"] if r.get("vulnerable", False))
    total_files = len(results["results"])
    
    if total_files == 0:
        return 0.0
    
    score = (vulnerable_files / total_files) * 10
    return round(min(score, 10.0), 1)


# Health check
@app.get("/")
def root():
    return {"status": "Backend running", "timestamp": datetime.now().isoformat()}


# =====================
# Dashboard Statistics
# =====================
@app.get("/dashboard/stats")
def get_dashboard_stats():
    return {
        "total_scans": 247,
        "critical_issues": 42,
        "resolved_issues": 156,
        "pending_jobs": 8,
        "stats_trend": {
            "scans": "+12%",
            "critical": "-8%",
            "resolved": "+24%",
            "pending": "3 active"
        }
    }


# =====================
# List all scans
# =====================
@app.get("/scans")
def list_scans():
    # Return mock data - replace with database query later
    return [
        {
            "id": "task_01",
            "repo": "org/frontend-app",
            "date": "2026-01-19",
            "status": "Completed",
            "severity": "High",
            "score": 8.2,
            "issues_count": 23
        },
        {
            "id": "task_02",
            "repo": "org/api-service",
            "date": "2026-01-18",
            "status": "Completed",
            "severity": "Medium",
            "score": 5.1,
            "issues_count": 12
        },
        {
            "id": "task_03",
            "repo": "org/mobile-app",
            "date": "2026-01-18",
            "status": "Running",
            "severity": None,
            "score": None,
            "issues_count": 0
        },
        {
            "id": "task_04",
            "repo": "org/backend-core",
            "date": "2026-01-17",
            "status": "Completed",
            "severity": "Low",
            "score": 2.3,
            "issues_count": 3
        },
        {
            "id": "task_05",
            "repo": "org/analytics",
            "date": "2026-01-17",
            "status": "Completed",
            "severity": "Critical",
            "score": 9.5,
            "issues_count": 45
        },
    ]


# =====================
# Start Scan
# =====================
@app.post("/scans")
def start_scan(req: RepoRequest):
    task = scan_repo_task.delay(req.repo_url)
    
    # Store session info
    repo_name = extract_repo_name(req.repo_url)
    scan_sessions[task.id] = {
        "repo_url": req.repo_url,
        "repo_name": repo_name,
        "started_at": datetime.now().isoformat(),
        "status": "PENDING"
    }
    
    return {
        "task_id": task.id,
        "repo_name": repo_name,
        "message": "Scan started"
    }


# Legacy endpoint for backward compatibility
@app.post("/scan/start")
def start_scan_legacy(req: RepoRequest):
    return start_scan(req)


# =====================
# Get scan details
# =====================
@app.get("/scans/{task_id}")
def get_scan(task_id: str):
    result = AsyncResult(task_id, app=celery_app)
    
    response = {
        "task_id": task_id,
        "state": result.state,
        "progress": None,
        "result": None
    }
    
    if result.state == "PROGRESS":
        response["progress"] = result.info
    elif result.successful():
        scan_data = result.result
        response["result"] = scan_data
        risk_score = calculate_risk_score(scan_data)
        response["risk_score"] = risk_score
        response["severity"] = calculate_severity(len(scan_data.get("results", [])))
    elif result.failed():
        response["error"] = str(result.info)
    
    return response


# Legacy endpoint for backward compatibility
@app.get("/scan/status/{task_id}")
def scan_status(task_id: str):
    return get_scan(task_id)


# Legacy endpoint for backward compatibility
@app.get("/scan/result/{task_id}")
def scan_result(task_id: str):
    return get_scan(task_id)
