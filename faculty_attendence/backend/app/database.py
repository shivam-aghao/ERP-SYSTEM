import logging
from typing import Generator, Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger("erp_fastapi")

# ==============================================================================
# 1. SUPABASE CLIENT
# ==============================================================================
supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    global supabase_client
    if supabase_client is None:
        try:
            key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
            supabase_client = create_client(settings.SUPABASE_URL, key)
            logger.info("Supabase client initialized successfully with URL: %s", settings.SUPABASE_URL)
        except Exception as e:
            logger.warning("Failed to initialize Supabase client: %s", e)
    return supabase_client

# ==============================================================================
# 2. SQLALCHEMY ORM & LOCAL / DIRECT POSTGRES FALLBACK ENGINE
# ==============================================================================
# Handle SQLite connect_args
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

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
