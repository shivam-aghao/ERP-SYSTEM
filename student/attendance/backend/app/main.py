import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database import engine, Base, SessionLocal, auto_migrate_schema
from app.models.db_models import *
from app.services.seed_service import seed_student_database
from app.services.supabase_service import supabase_service
from app.api.v1 import student_router

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("student_erp_fastapi")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting SSGMCE Student ERP Dashboard Backend...")
    # 1. Initialize local SQLite tables
    try:
        Base.metadata.create_all(bind=engine)
        auto_migrate_schema(engine)
        logger.info("Local database tables verified and migrated.")
        
        db = SessionLocal()
        try:
            seed_student_database(db)
        finally:
            db.close()
    except Exception as e:
        logger.error("Error during database initialization: %s", e)

    # 2. Check Supabase connection non-blockingly
    try:
        sb_status = supabase_service.check_connection()
        logger.info("Supabase connection status on startup: %s", sb_status.get("status"))
    except Exception as e:
        logger.warning("Supabase startup probe notice: %s", e)

    logger.info("SSGMCE Student ERP Backend ready on port %d!", settings.PORT)
    yield
    logger.info("SSGMCE Student ERP Backend shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="High-resilience FastAPI & Supabase backend for SSGMCE Student Portal",
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Configuration
origins = settings.CORS_ORIGINS
allowed_origins = origins if isinstance(origins, list) else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Performance & Telemetry Middleware
@app.middleware("http")
async def add_process_time_and_telemetry(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = round((time.time() - start_time) * 1000, 2)
    response.headers["X-Process-Time-Ms"] = str(process_time)
    response.headers["X-Supabase-Status"] = "ONLINE" if supabase_service._connected else "FALLBACK"
    return response

# Global Exception Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "code": exc.status_code,
            "message": exc.detail,
            "error": {"code": exc.status_code, "message": exc.detail}
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "code": 422,
            "message": "Request validation error",
            "error": {"code": 422, "details": exc.errors()}
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception processing %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "code": 500,
            "message": "Internal server processing error. Safeguards active.",
            "error": {"code": 500, "details": str(exc)}
        }
    )

# Include API v1 Routes
app.include_router(student_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
def root():
    return {
        "success": True,
        "name": settings.PROJECT_NAME,
        "role": "student",
        "student": "Shivam Sanjay Aghao (308637)",
        "docs": "/docs",
        "status": "online",
        "supabase": supabase_service._status_dict()
    }

@app.get("/health", tags=["Health"])
def health():
    sb_status = supabase_service.check_connection()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.1.0",
        "framework": "FastAPI",
        "supabase": sb_status,
        "database": "Supabase PostgreSQL + Local SQLite Dual Engine"
    }
