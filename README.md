# mini-project-
uvicorn backend.main:app --reload
# On Windows, -P solo is required for stability
celery -A backend.celery_app worker --loglevel=info -P solo
npm run dev
 sudo service redis-server start