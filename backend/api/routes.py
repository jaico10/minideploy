from fastapi import APIRouter
from pydantic import BaseModel
from celery.result import AsyncResult

from backend.tasks import scan_repo_task
from backend.celery_app import celery_app

router = APIRouter(prefix="/scan", tags=["scan"])


# ✅ Request body model
class RepoRequest(BaseModel):
    repo_url: str


# ✅ Start scan endpoint (JSON body)
@router.post("/start")
def start_scan(req: RepoRequest):
    task = scan_repo_task.delay(req.repo_url)
    return {"task_id": task.id}


# ✅ Status endpoint
@router.get("/status/{task_id}")
def get_status(task_id: str):
    task = AsyncResult(task_id, app=celery_app)

    return {
        "task_id": task_id,
        "state": task.state,
        "result": task.result if task.successful() else None
    }
