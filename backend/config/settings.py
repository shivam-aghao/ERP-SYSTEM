import os
from typing import List
from pydantic_settings import BaseSettings if False else object

class Settings:
    PROJECT_NAME: str = "SSGMCE College ERP Unified System"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Path configuration
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ERP_ROOT: str = os.path.dirname(BASE_DIR)
    FRONTEND_DIR: str = os.path.join(ERP_ROOT, "frontend")
    DB_PATH: str = os.path.join(BASE_DIR, "erp.db").replace("\\\\", "/")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://gftqvclenyplnuoocbwe.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()

