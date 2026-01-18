from fastapi import FastAPI
from pydantic import BaseModel
from celery.result import AsyncResult

from backend.tasks import scan_repo_task
from backend.celery_app import celery_app

app = FastAPI(title="RepoGuardAI - Background Scanner")

class RepoRequest(BaseModel):
    repo_url: str

@app.post("/scan/start")
def start_scan(req: RepoRequest):
    task = scan_repo_task.delay(req.repo_url)
    return {"message": "Scan started", "task_id": task.id}

@app.get("/scan/status/{task_id}")
def scan_status(task_id: str):
    result = AsyncResult(task_id, app=celery_app)

    response = {
        "task_id": task_id,
        "state": result.state,
    }

    if result.state == "PROGRESS":
        response["progress"] = result.info

    return response

@app.get("/scan/result/{task_id}")
def scan_result(task_id: str):
    result = AsyncResult(task_id, app=celery_app)

    if not result.ready():
        return {"task_id": task_id, "state": result.state, "message": "Result not ready"}

    return {"task_id": task_id, "state": result.state, "result": result.result}
