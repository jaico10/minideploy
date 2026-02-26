from sqlalchemy import create_engine, text
from backend.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    print("--- REPOSITORIES ---")
    result = conn.execute(text("SELECT id, url FROM repositories"))
    for row in result:
        print(row)
    
    print("\n--- SCANS ---")
    result = conn.execute(text("SELECT id, repo_id, task_id, status, error_message FROM scans"))
    for row in result:
        print(row)
