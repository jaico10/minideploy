from sqlalchemy.orm import Session
from backend.models.scan import Scan, ScanStatus, ScanResult, SeverityLevel
from backend.schemas.scan import ScanCreate, DashboardStats
from typing import List, Optional
from datetime import datetime

def create_scan(db: Session, repo_id: int, user_id: int, task_id: str) -> Scan:
    db_scan = Scan(
        task_id=task_id,
        user_id=user_id,
        repo_id=repo_id,
        status=ScanStatus.PENDING
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    return db_scan

from sqlalchemy.orm import Session, joinedload

def get_scan_by_task_id(db: Session, task_id: str, user_id: int) -> Optional[Scan]:
    return db.query(Scan).options(joinedload(Scan.scan_results)).filter(Scan.task_id == task_id, Scan.user_id == user_id).first()

def list_scans(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Scan]:
    return db.query(Scan).filter(Scan.user_id == user_id).offset(skip).limit(limit).all()

def update_scan_status(db: Session, task_id: str, status: ScanStatus, results: Optional[dict] = None, error_message: Optional[str] = None, risk_score: Optional[float] = None, severity: Optional[SeverityLevel] = None, total_files: Optional[int] = None, issues_count: Optional[int] = None, completed_at: Optional[datetime] = None) -> Optional[Scan]:
    scan = db.query(Scan).filter(Scan.task_id == task_id).first()
    if scan:
        scan.status = status
        if results is not None:
            scan.results = results
        if error_message is not None:
            scan.error_message = error_message
        if risk_score is not None:
            scan.risk_score = risk_score
        if severity is not None:
            scan.severity = severity
        if total_files is not None:
            scan.total_files = total_files
        if issues_count is not None:
            scan.issues_count = issues_count
        if completed_at is not None:
            scan.completed_at = completed_at
        db.commit()
        db.refresh(scan)
    return scan

def get_results_for_scan(db: Session, task_id: str) -> Optional[dict]:
    scan = db.query(Scan).filter(Scan.task_id == task_id).first()
    return scan.results if scan else None

def get_dashboard_stats(db: Session, user_id: int) -> DashboardStats:
    total = db.query(Scan).filter(Scan.user_id == user_id).count()
    completed = db.query(Scan).filter(Scan.user_id == user_id, Scan.status == ScanStatus.COMPLETED).count()
    failed = db.query(Scan).filter(Scan.user_id == user_id, Scan.status == ScanStatus.FAILED).count()
    pending = db.query(Scan).filter(Scan.user_id == user_id, Scan.status == ScanStatus.PENDING).count()
    # For vulnerabilities, count from results of user's scans
    user_scan_ids = db.query(Scan.id).filter(Scan.user_id == user_id).subquery()
    vulnerabilities = db.query(ScanResult).filter(ScanResult.scan_id.in_(user_scan_ids), ScanResult.vulnerable == True).count()
    return DashboardStats(
        total_scans=total,
        completed_scans=completed,
        failed_scans=failed,
        pending_scans=pending,
        vulnerabilities_found=vulnerabilities
    )

def delete_scan(db: Session, task_id: str) -> bool:
    scan = db.query(Scan).filter(Scan.task_id == task_id).first()
    if scan:
        db.delete(scan)
        db.commit()
        return True
    return False

def bulk_create_results(db: Session, scan_id: int, results: List[dict]):
    for result in results:
        db_result = ScanResult(
            scan_id=scan_id,
            file_path=result["file"],
            vulnerable=result.get("vulnerable", False),
            scanned_code=result.get("scanned_code"),
            fixed_code=result.get("fixed_code"),
            error=result.get("error")
        )
        db.add(db_result)
    db.commit()