from celery import Celery
from backend.config import REDIS_URL

celery_app = Celery(
    "repoguardai",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_track_started=True,
    result_expires=3600
)
