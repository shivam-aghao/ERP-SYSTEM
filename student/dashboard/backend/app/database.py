import logging
from typing import Generator, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger("student_erp_fastapi")

supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    global supabase_client
    if supabase_client is None:
        try:
            key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
            supabase_client = create_client(settings.SUPABASE_URL, key)
            logger.info("Supabase client initialized for Student Dashboard: %s", settings.SUPABASE_URL)
        except Exception as e:
            logger.warning("Supabase client init warning: %s", e)
    return supabase_client

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def auto_migrate_schema(eng):
    """Automatically ensures all student module columns exist in local SQLite table."""
    try:
        with eng.connect() as conn:
            res = conn.execute(text("PRAGMA table_info(students)"))
            existing_cols = {row[1] for row in res.fetchall()}
            
            missing_cols = [
                ("date_of_birth", "TEXT DEFAULT '2004-08-15'"),
                ("gender", "TEXT DEFAULT 'Male'"),
                ("blood_group", "TEXT DEFAULT 'O+ve'"),
                ("nationality", "TEXT DEFAULT 'Indian'"),
                ("emergency_contact", "TEXT DEFAULT '+91 98230 41092'"),
                ("permanent_address", "TEXT DEFAULT 'Plot 14, Gajanan Colony, Buldhana Road, Shegaon'"),
                ("district", "TEXT DEFAULT 'Buldhana'"),
                ("state", "TEXT DEFAULT 'Maharashtra'"),
                ("pincode", "TEXT DEFAULT '444203'"),
                ("father_name", "TEXT DEFAULT 'Mr. Sanjay Aghao'"),
                ("mother_name", "TEXT DEFAULT 'Mrs. Sunita Aghao'"),
                ("faculty_mentor", "TEXT DEFAULT 'Dr. Rohan Deshmukh (HOD, CSE)'"),
                ("admission_quota", "TEXT DEFAULT 'MHT-CET State Merit (Autonomous CAP)'"),
                ("hostel_status", "TEXT DEFAULT 'Day Scholar'")
            ]
            for col_name, col_def in missing_cols:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE students ADD COLUMN {col_name} {col_def}"))
            conn.commit()
            logger.info("SQLite schema verification and column migration completed.")
    except Exception as e:
        logger.warning("Auto migrate SQLite columns notice: %s", e)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
