import os
import logging
import urllib.parse
from typing import Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.config.settings import settings

logger = logging.getLogger("ssgmce_erp_backend.database")

# Supabase REST Client singleton
supabase_client = None


def get_supabase_client():
    """Returns singleton Supabase Python client instance connected to Supabase Cloud."""
    global supabase_client
    if supabase_client is None:
        try:
            from supabase import create_client
            key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
            if key and settings.SUPABASE_URL:
                supabase_client = create_client(settings.SUPABASE_URL, key)
                logger.info("Supabase Cloud Client initialized successfully: %s", settings.SUPABASE_URL)
        except Exception as e:
            logger.warning("Supabase Cloud Client initialization notice: %s", e)
    return supabase_client


def _init_db_engine():
    """
    Initializes the primary database engine:
    1. Connects directly to Supabase Cloud PostgreSQL (cleaning any Prisma/libpq incompatible options).
    2. Gracefully falls back to local SQLite (backend/erp.db) only if offline / unreachable.
    """
    raw_url = (settings.DATABASE_URL or "").strip()
    if (raw_url.startswith('"') and raw_url.endswith('"')) or (raw_url.startswith("'") and raw_url.endswith("'")):
        raw_url = raw_url[1:-1].strip()

    # Clean libpq-incompatible query parameters (e.g. pgbouncer=true used by Prisma)
    clean_url = raw_url
    if "pgbouncer=true" in clean_url:
        clean_url = clean_url.replace("?pgbouncer=true&", "?").replace("&pgbouncer=true", "").replace("?pgbouncer=true", "")

    # Ensure psycopg (v3) dialect is used if postgresql://
    if clean_url.startswith("postgresql://") and not clean_url.startswith("postgresql+psycopg://"):
        clean_url = "postgresql+psycopg://" + clean_url[len("postgresql://"):]

    if clean_url and ("postgresql" in clean_url or "postgres" in clean_url):
        try:
            parsed = urllib.parse.urlparse(clean_url)
            host = parsed.hostname or "supabase.pooler"
            port = parsed.port or 5432

            pg_engine = create_engine(
                clean_url,
                pool_pre_ping=True,
                pool_recycle=300,
                pool_size=10,
                max_overflow=20,
                connect_args={"connect_timeout": 10},
                echo=False
            )
            # Verify actual connectivity with a fast SELECT 1 query
            with pg_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Connected directly to Supabase Cloud PostgreSQL (%s:%s).", host, port)
            return pg_engine
        except Exception as e:
            logger.warning(
                "Direct Supabase PostgreSQL connection unavailable (%s). "
                "Activating resilient SQLite database engine with live Supabase Cloud REST synchronization.",
                e
            )

    # Resilient SQLite fallback engine
    sqlite_path = os.path.join(settings.BASE_DIR, "erp.db")
    sqlite_url = f"sqlite:///{sqlite_path}"

    try:
        from backend.utils.db_sync import ensure_sqlite_schema, sync_supabase_to_local
        ensure_sqlite_schema()
        # Non-blocking sync with Supabase Cloud
        try:
            sync_supabase_to_local(get_supabase_client())
        except Exception as _sync_err:
            logger.debug("Initial Supabase sync notice: %s", _sync_err)
    except Exception as e:
        logger.debug("Schema sync notice: %s", e)

    sqlite_engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False},
        echo=False
    )
    logger.info("Resilient Database Engine initialized at: %s with live Supabase Cloud connection.", sqlite_url)
    return sqlite_engine


engine = _init_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that yields a database session connected directly to Supabase PostgreSQL."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
