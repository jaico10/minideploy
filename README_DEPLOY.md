# 🚀 Railway Deployment Guide (One-Click Style)

This project is configured to be "plug-and-play" on Railway. Since your app has a Frontend, Backend, and Worker, follow these exact steps:

### 1. The Setup
1. Log in to [Railway.app](https://railway.app/).
2. Click **"New Project"** -> **"Provision PostgreSQL"**.
3. Click **"New"** -> **"Database"** -> **"Add Redis"**.

### 2. Deploy the Backend (API)
1. Click **"New"** -> **"GitHub Repo"** -> Select this repository.
2. Go to **Settings** -> **General** -> **Root Directory**: Set to `/`.
3. Go to **Settings** -> **Deploy** -> **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`.
4. Go to **Variables** -> Add all variables from your `.env` (like `GROQ_API_KEY`, etc.).
   - *Note: Railway automatically provides `DATABASE_URL` and `REDIS_URL` if you added the databases.*

### 3. Deploy the Background Worker (Celery)
1. Click **"New"** -> **"GitHub Repo"** -> Select the **same** repository again.
2. Go to **Settings** -> **General** -> **Service Name**: Change to `celery-worker`.
3. Go to **Settings** -> **Deploy** -> **Start Command**: `celery -A backend.celery_app worker --loglevel=info -P solo`.
4. Go to **Variables** -> Click **"Reference"** to pull the same variables from your Backend service.

### 4. Deploy the Frontend (Vite)
1. Click **"New"** -> **"GitHub Repo"** -> Select the **same** repository a third time.
2. Go to **Settings** -> **General** -> **Root Directory**: Set to `/front`.
3. Railway will auto-detect Vite and use `npm run build` and `npm run dev`.
4. Go to **Variables** -> Add `VITE_API_URL` and point it to your Backend's public URL.

---

### **Essential Environment Variables Checklist**
Ensure these are in your Railway **Backend** Variables:
- `GROQ_API_KEY` (Your key)
- `GITHUB_TOKEN` (Your personal access token)
- `SECRET_KEY` (A random string)
- `DATABASE_URL` (Auto-filled by Railway)
- `REDIS_URL` (Auto-filled by Railway)
