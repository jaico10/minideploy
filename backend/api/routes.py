from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.auth import get_current_active_user
from backend.tasks import scan_repo_task
from backend.crud.scan_crud import create_scan, get_scan_by_task_id, list_scans, get_dashboard_stats
from backend.crud.repo_crud import get_repository_by_url, create_repository
from backend.schemas.scan import ScanCreate, ScanOut, ScanDetailOut, DashboardStats, RepositoryCreate
from backend.models.scan import User
from backend.api.pdf_generator import generate_pdf_report

router = APIRouter(prefix="/scans", tags=["scans"])

import requests

@router.get("/github/repos")
def get_github_repos(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.github_access_token:
        # Returning empty to gracefully handle users who didn't sign in via github
        return []
        
    headers = {
        "Authorization": f"Bearer {current_user.github_access_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    # We fetch user's own repos and repos they collaborate on
    response = requests.get("https://api.github.com/user/repos?sort=updated&per_page=100", headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch repositories from GitHub")
        
    repos = response.json()
    return [{"name": r["full_name"], "url": r["html_url"], "private": r["private"]} for r in repos]

from backend.models.scan import ScanResult, Scan

@router.get("/issues/vulnerable")
def get_vulnerable_issues(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    issues = (
        db.query(ScanResult)
        .join(Scan, ScanResult.scan_id == Scan.id)
        .filter(Scan.user_id == current_user.id, ScanResult.vulnerable == True)
        .all()
    )
    result = []
    for i in issues:
        result.append({
            "id": i.id,
            "scan_id": i.scan_id,
            "file_path": i.file_path,
            "scanned_code": i.scanned_code,
            "fixed_code": i.fixed_code,
            "repo_url": i.scan.repository.url if i.scan and i.scan.repository else "Unknown",
        })
    return result

@router.post("/", response_model=ScanOut)
def create_new_scan(scan: ScanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Get or create repository
    clean_url = scan.repo_url.strip().rstrip("/")
    db_repo = get_repository_by_url(db, url=clean_url)
    if not db_repo:
        try:
            parts = clean_url.split('/')
            if len(parts) < 2:
                raise ValueError("Invalid GitHub URL format")
            repo_name = parts[-1]
            repo_owner = parts[-2]
            repo_create = RepositoryCreate(url=clean_url, name=repo_name, owner=repo_owner)
            db_repo = create_repository(db, repo_create)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid repository URL: {str(e)}")
    
    task = scan_repo_task.delay(db_repo.id, current_user.id)
    db_scan = create_scan(db, db_repo.id, current_user.id, task.id)
    return db_scan

@router.get("/", response_model=list[ScanOut])
def read_scans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    scans = list_scans(db, current_user.id, skip=skip, limit=limit)
    return scans

@router.get("/{task_id}", response_model=ScanDetailOut)
def read_scan(task_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    scan = get_scan_by_task_id(db, task_id=task_id, user_id=current_user.id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

@router.get("/{task_id}/report/pdf")
def export_scan_pdf(task_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    scan = get_scan_by_task_id(db, task_id=task_id, user_id=current_user.id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    pdf_buffer = generate_pdf_report(scan)
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=scan_report_{task_id}.pdf"}
    )

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return get_dashboard_stats(db, current_user.id)

from backend.celery_app import celery_app

@router.get("/{task_id}/progress")
def get_task_progress(task_id: str, current_user: User = Depends(get_current_active_user)):
    task = celery_app.AsyncResult(task_id)
    if task.state == 'PROGRESS':
        info = task.info or {}
        current = info.get("current", 0)
        total = info.get("total", 1)
        percent = int((current / total) * 100) if total > 0 else 0
        return {
            "state": task.state,
            "current": current,
            "total": total,
            "file": info.get("file", ""),
            "percent": percent
        }
    elif task.state == 'SUCCESS':
        return {"state": task.state, "percent": 100}
    elif task.state == 'FAILURE':
        return {"state": task.state, "percent": 0, "error": str(task.info)}
    
    return {"state": task.state, "percent": 0}
