import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "SSGMCE Student ERP Dashboard"
    API_V1_STR: str = "/api/v1/student"
    PORT: int = 8001
    HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"

    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "*",
    ]

    SUPABASE_URL: str = "https://gftqvclenyplnuoocbwe.supabase.co"
    SUPABASE_ANON_KEY: str = "sb_publishable_S1S9X948M9O5FyRmEeOISQ_FJQ4i6sv"
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    DATABASE_URL: str = "sqlite:///./student_erp.db"

    JWT_SECRET: str = "ssgmce_student_jwt_access_secret_key_2026_z83k1!"
    JWT_REFRESH_SECRET: str = "ssgmce_student_jwt_refresh_secret_key_2026_w19p4!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 180
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except Exception:
                return [i.strip() for i in v.split(",") if i.strip()]
        return v

settings = Settings()
