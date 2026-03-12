from sqlalchemy import text
from backend.core.database import engine

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN github_access_token VARCHAR;"))
        conn.commit()
        print("Successfully added github_access_token column.")
    except Exception as e:
        print(f"Error adding column: {e}")
