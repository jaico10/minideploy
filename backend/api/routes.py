from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.auth import get_current_active_user
from backend.tasks import scan_repo_task
from backend.crud.scan_crud import create_scan, get_scan_by_task_id, list_scans, get_dashboard_stats
from backend.crud.repo_crud import get_repository_by_url, create_repository
from backend.schemas.scan import ScanCreate, ScanOut, ScanDetailOut, DashboardStats, RepositoryCreate
from backend.models.scan import User

router = APIRouter(prefix="/scans", tags=["scans"])

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

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return get_dashboard_stats(db, current_user.id)
