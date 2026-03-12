#!/bin/bash

echo "🚀 Starting Code Sentinel for WSL..."

# Start Redis if not running
if ! pgrep -x "redis-server" > /dev/null
then
    echo "Starting Redis..."
    sudo service redis-server start
fi

# Start PostgreSQL if not running
if ! pgrep -x "postgres" > /dev/null
then
    echo "Starting PostgreSQL..."
    sudo service postgresql start
fi

# Create venv if it doesn't exist
if [ ! -d "venv_linux" ]; then
    echo "Creating virtual environment 'venv_linux'..."
    python3 -m venv venv_linux || { echo "❌ Failed to create venv. Run: sudo apt install python3-venv"; exit 1; }
    echo "Installing requirements..."
    ./venv_linux/bin/python3 -m pip install -r requirements.txt
fi

# Function to stop background processes on exit
cleanup() {
    echo "Stopping processes..."
    kill $(jobs -p)
    exit
}
trap cleanup SIGINT

# Start Backend
echo "Starting Backend API..."
./venv_linux/bin/python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &

# Start Celery Worker
echo "Starting Celery Worker..."
./venv_linux/bin/python3 -m celery -A backend.celery_app worker --loglevel=info &

# Start Frontend
echo "Starting Frontend..."
cd front && npm install && npm run dev &

echo "✅ All processes started!"
echo "Dashboard: http://localhost:5173"
echo "API: http://localhost:8000"

# Keep the script running to keep background jobs alive
wait
