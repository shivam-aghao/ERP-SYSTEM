import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from sqlalchemy import text
from backend.config.database import engine, get_db, get_supabase_client
from backend.config.settings import settings

def test_database_engine_connection():
    """Verify that SQLAlchemy engine connects directly to Supabase PostgreSQL."""
    with engine.connect() as conn:
        res = conn.execute(text("SELECT current_database(), current_user, version();")).fetchone()
        assert res is not None
        db_name = res[0]
        curr_user = res[1]
        version = res[2]
        print(f"Connected to DB: {db_name}, User: {curr_user}")
        assert "PostgreSQL" in version

def test_core_tables_presence_and_counts():
    """Verify presence and non-zero counts for critical institutional tables."""
    with engine.connect() as conn:
        tables = [
            ("students", 304),
            ("teachers", 15),
            ("classes", 4),
            ("subjects", 15),
            ("quizzes", 3),
            ("student_academic_records", 400),
            ("notifications", 15),
            ("roles", 5),
            ("timetable_entries", 200),
            ("attendance_sessions", 200)
        ]
        for tbl, min_expected in tables:
            cnt = conn.execute(text(f"SELECT count(*) FROM public.{tbl};")).scalar()
            print(f"Table '{tbl}': {cnt} rows")
            assert cnt >= min_expected, f"Table '{tbl}' has {cnt} rows, expected at least {min_expected}"

def test_supabase_rest_client():
    """Verify that Supabase Python REST client functions against Supabase Cloud."""
    client = get_supabase_client()
    assert client is not None
    data = client.table("students").select("student_code, full_name").limit(2).execute().data
    assert len(data) == 2
    print("Supabase client query verified:", data)

if __name__ == "__main__":
    test_database_engine_connection()
    test_core_tables_presence_and_counts()
    test_supabase_rest_client()
    print("ALL DATABASE TESTS PASSED!")
