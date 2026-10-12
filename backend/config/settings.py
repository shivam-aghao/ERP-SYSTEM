import os
import logging
from typing import List
from dotenv import load_dotenv

logger = logging.getLogger("ssgmce_erp_backend.settings")

# Determine base paths
BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ERP_ROOT: str = os.path.dirname(BASE_DIR)

# Load environment variables from .env files (root and backend)
load_dotenv(os.path.join(ERP_ROOT, ".env"))
load_dotenv(os.path.join(BASE_DIR, ".env"))

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "SSGMCE College ERP Unified System")
    VERSION: str = os.getenv("VERSION", "2.0.0")
    API_V1_STR: str = "/api/v1"
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Path configuration
    BASE_DIR: str = BASE_DIR
    ERP_ROOT: str = ERP_ROOT
    
    # Supabase PostgreSQL Single Production Database (Strictly from Environment)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Supabase Cloud Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://gftqvclenyplnuoocbwe.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # JWT & Session Security
    JWT_SECRET: str = os.getenv("JWT_SECRET") or os.getenv("SUPABASE_JWT_SECRET") or "ssgmce-erp-secure-jwt-auth-secret-key-2026-autonomous"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()

if not settings.DATABASE_URL:
    logger.warning(
        "DATABASE_URL is not configured in environment variables or .env. "
        "Please configure DATABASE_URL according to .env.example."
    )
