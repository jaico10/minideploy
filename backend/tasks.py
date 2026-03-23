from datetime import datetime

from backend.celery_app import celery_app
from backend.github.fetch_repo import fetch_repo_files
from backend.llm.scanner import scan_and_mark_code
from backend.llm.remediator import remediate_marked_code
from backend.config import MARKER
from backend.core.database import SessionLocal
from backend.models.scan import ScanStatus, SeverityLevel
from backend.crud.scan_crud import (
    get_scan_by_task_id,
    update_scan_status,
    bulk_create_results,
)


def _severity_from_count(count: int) -> SeverityLevel:
    if count >= 10:
        return SeverityLevel.CRITICAL
    elif count >= 5:
        return SeverityLevel.HIGH
    elif count > 0:
        return SeverityLevel.MEDIUM
    return SeverityLevel.LOW


def _risk_score(results: list) -> float:
    if not results:
        return 0.0
    vuln = sum(1 for r in results if r.get("vulnerable", False))
    score = (vuln / len(results)) * 10
    return round(min(score, 10.0), 1)


@celery_app.task(bind=True)
def scan_repo_task(self, repo_id: int, user_id: int):
    db = SessionLocal()
    task_id = self.request.id

    try:
        # Get repo URL
        from backend.crud.repo_crud import get_repository_by_id
        repo = get_repository_by_id(db, repo_id)
        if not repo:
            raise ValueError("Repository not found")
        repo_url = repo.url

        # ── 1. Mark DB row as IN PROGRESS ─────────────────────────────
        update_scan_status(db, task_id, ScanStatus.PROGRESS)

        # Get user's github token if available
        from backend.crud.user_crud import get_user_by_id
        current_user = get_user_by_id(db, user_id)
        token = current_user.github_access_token if current_user else None

        # ── 2. Fetch all code files from GitHub ───────────────────────
        files = fetch_repo_files(repo_url, token=token)
        total = len(files)

        results = []

        # ── 3. Scan + remediate each file ─────────────────────────────
        for i, f in enumerate(files, start=1):
            self.update_state(
                state="PROGRESS",
                meta={"current": i, "total": total, "file": f["path"]}
            )

            try:
                scanned = scan_and_mark_code(f["content"], f["path"])
                fixed   = remediate_marked_code(scanned)

                results.append({
                    "file":         f["path"],
                    "vulnerable":   (MARKER in scanned),
                    "scanned_code": scanned,
                    "fixed_code":   fixed,
                })

            except Exception as e:
                results.append({
                    "file":         f["path"],
                    "vulnerable":   False,
                    "scanned_code": f["content"],
                    "fixed_code":   f["content"],
                    "error":        str(e),
                })

        # ── 4. Calculate summary stats ────────────────────────────────
        issues_count = sum(1 for r in results if r.get("vulnerable", False))
        risk_score   = _risk_score(results)
        severity     = _severity_from_count(issues_count)

        # ── 5. Persist all results to DB ──────────────────────────────
        scan = get_scan_by_task_id(db, task_id, user_id)
        if scan:
            bulk_create_results(db, scan.id, results)

        # ── 6. Mark scan as COMPLETED ─────────────────────────────────
        update_scan_status(
            db,
            task_id,
            status=ScanStatus.COMPLETED,
            risk_score=risk_score,
            severity=severity,
            total_files=total,
            issues_count=issues_count,
            completed_at=datetime.utcnow(),
        )

        payload = {
            "repo_url":    repo_url,
            "total_files": total,
            "results":     results,
        }
        return payload

    except Exception as exc:
        # ── Mark scan as FAILED in DB ─────────────────────────────────
        update_scan_status(db, task_id, ScanStatus.FAILED)
        raise exc

    finally:
        db.close()
