import os
import logging
import urllib.parse
from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.config.settings import settings

logger = logging.getLogger("ssgmce_erp_backend.database")

import socket
import urllib.parse
from sqlalchemy import text

# Resilient Supabase pooler host-to-IP map (AWS Singapore region)
KNOWN_POOLER_IPS = {
    "aws-0-ap-southeast-1.pooler.supabase.com": ["52.74.252.201", "52.77.146.31", "54.255.219.82"],
}

# Optional socket.getaddrinfo fallback patch for any Python-level requests
_orig_getaddrinfo = socket.getaddrinfo
def _resilient_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    try:
        return _orig_getaddrinfo(host, port, family, type, proto, flags)
    except socket.gaierror:
        if host in KNOWN_POOLER_IPS:
            for ip in KNOWN_POOLER_IPS[host]:
                try:
                    return _orig_getaddrinfo(ip, port, family, type, proto, flags)
                except Exception:
                    continue
        raise

socket.getaddrinfo = _resilient_getaddrinfo


def _create_resilient_engine():
    db_url = settings.DATABASE_URL
    if db_url and db_url.startswith(("postgres://", "postgresql://", "postgresql+psycopg2://")):
        parsed = urllib.parse.urlparse(db_url)
        host = parsed.hostname
        port = parsed.port or 6543
        
        candidates = []
        try:
            candidates.extend(socket.gethostbyname_ex(host)[2])
        except Exception:
            pass
        
        if host in KNOWN_POOLER_IPS:
            for fb in KNOWN_POOLER_IPS[host]:
                if fb not in candidates:
                    candidates.append(fb)

        # Try connecting with verified hostaddr to bypass OS DNS resolution failures
        for ip in candidates:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(2.0)
                s.connect((ip, port))
                s.close()

                eng = create_engine(
                    db_url,
                    connect_args={
                        "hostaddr": ip,
                        "connect_timeout": 10,
                        "keepalives": 1,
                        "keepalives_idle": 30,
                        "keepalives_interval": 10,
                        "keepalives_count": 5
                    },
                    pool_pre_ping=True,
                    pool_recycle=300,
                    echo=False
                )
                with eng.connect() as conn:
                    conn.execute(text("SELECT 1"))
                logger.info("Connected to PostgreSQL using verified pooler IP %s for %s", ip, host)
                return eng
            except Exception as conn_err:
                logger.warning("Attempt with pooler IP %s failed: %s", ip, conn_err)

    # Fallback to direct creation or SQLite if offline
    try:
        eng = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_recycle=300,
            echo=False
        )
        with eng.connect() as conn:
            pass
        return eng
    except Exception as e:
        logger.warning("PostgreSQL direct connection fallback: %s. Using SQLite engine.", e)
        sqlite_path = os.path.join(settings.BASE_DIR, "erp.db")
        return create_engine(
            f"sqlite:///{sqlite_path}",
            connect_args={"check_same_thread": False},
            echo=False
        )

engine = _create_resilient_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency that yields a database session connected directly to Supabase PostgreSQL."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Supabase REST Client singleton
supabase_client = None


def get_supabase_client():
    """Returns singleton Supabase Python client instance."""
    global supabase_client
    if supabase_client is None:
        try:
            from supabase import create_client
            key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
            if key:
                supabase_client = create_client(settings.SUPABASE_URL, key)
                logger.info("Supabase client initialized successfully: %s", settings.SUPABASE_URL)
        except Exception as e:
            logger.warning("Supabase direct client notice: %s", e)
    return supabase_client

