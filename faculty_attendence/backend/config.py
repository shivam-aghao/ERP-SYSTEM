import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "SSGMCE Faculty Attendance API"
    PORT: int = int(os.getenv("PORT", "5000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    NODE_ENV: str = os.getenv("NODE_ENV", "development")
    
    # Supabase credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://gftqvclenyplnuoocbwe.supabase.co")
    SUPABASE_KEY: str = os.getenv(
        "SUPABASE_ANON_KEY",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY"
    )
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "ssgmce_super_secure_jwt_access_secret_key_2026_x94j2!")
    DEFAULT_TEACHER_ID: str = "43415a71-b4c9-4969-b836-9e4342ed6613"
    DEFAULT_TEACHER_CODE: str = "EMP-CSE-1042"

settings = Settings()
