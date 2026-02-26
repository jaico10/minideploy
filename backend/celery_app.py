from celery import Celery
from backend.config import REDIS_URL

celery_app = Celery(
    "code_sentinel",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_track_started=True,
    result_expires=3600
)

# ✅ IMPORTANT: register tasks inside backend
celery_app.autodiscover_tasks(["backend"])
