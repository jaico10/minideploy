from backend.celery_app import celery_app
from backend.github.fetch_repo import fetch_repo_files
from backend.llm.scanner import scan_and_mark_code
from backend.llm.remediator import remediate_marked_code
from backend.config import MARKER


@celery_app.task(bind=True)
def scan_repo_task(self, repo_url: str):
    files = fetch_repo_files(repo_url)

    results = []
    total = len(files)

    for i, f in enumerate(files, start=1):
        self.update_state(
            state="PROGRESS",
            meta={"current": i, "total": total, "file": f["path"]}
        )

        try:
            scanned = scan_and_mark_code(f["content"])
            fixed = remediate_marked_code(scanned)

            results.append({
                "file": f["path"],
                "vulnerable": (MARKER in scanned),
                "scanned_code": scanned,
                "fixed_code": fixed
            })

        except Exception as e:
            results.append({
                "file": f["path"],
                "vulnerable": False,
                "scanned_code": f["content"],
                "fixed_code": f["content"],
                "error": str(e)
            })

    return {
        "repo_url": repo_url,
        "total_files": total,
        "results": results
    }
