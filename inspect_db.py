import sys
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session
from backend.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

# Get table names
tables = inspector.get_table_names()
print('Tables:', tables)

with engine.connect() as conn:
    for table_name in tables:
        print(f'\n{table_name}:')
        from sqlalchemy import text
        result = conn.execute(text(f'SELECT * FROM {table_name}'))
        rows = result.fetchall()
        print(rows)
