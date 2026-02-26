@echo off
echo 🚀 Starting Code Sentinel for Windows...

:: Check if venv exists
if not exist "venv" (
    echo ❌ Virtual environment 'venv' not found. Please create it first.
    pause
    exit /b
)

:: Start Backend
echo Starting Backend API...
start "Backend API" cmd /k ".\venv\Scripts\activate && uvicorn backend.main:app --reload"

:: Start Celery Worker
echo Starting Celery Worker...
start "Celery Worker" cmd /k ".\venv\Scripts\activate && celery -A backend.celery_app worker --loglevel=info -P solo"

:: Start Frontend
echo Starting Frontend...
cd front
start "Frontend" cmd /k "npm run dev"

echo ✅ All windows opened! 
echo Dashboard: http://localhost:5173
echo API: http://localhost:8000
pause
