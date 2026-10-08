import os
from typing import List
try:
    from pydantic_settings import BaseSettings
except ImportError:
    BaseSettings = object

class Settings:
    PROJECT_NAME: str = "SSGMCE College ERP Unified System"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Path configuration
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ERP_ROOT: str = os.path.dirname(BASE_DIR)
    
    # Supabase PostgreSQL Single Production Database
    DEFAULT_PG_URL: str = "postgresql://erp_app.gftqvclenyplnuoocbwe:SsgmceApp2026@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
    DATABASE_URL: str = os.getenv("DATABASE_URL", DEFAULT_PG_URL)
    
    # Supabase Cloud Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://gftqvclenyplnuoocbwe.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQ4NzcyNiwiZXhwIjoyMTA2MDYzNzI2fQ.0CNTyl3HMiyYVhSPdQEhq_4LUYUVOY29aAAOLHwxEt4")
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()
