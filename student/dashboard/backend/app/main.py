import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base, SessionLocal, get_supabase_client
from app.models.db_models import *
from app.services.seed_service import seed_student_database
from app.api.v1 import student_router

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("student_erp_fastapi")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting SSGMCE Student ERP Dashboard Backend...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Student database tables initialized.")
        
        db = SessionLocal()
        try:
            seed_student_database(db)
        finally:
            db.close()
    except Exception as e:
        logger.error("Error during student database initialization: %s", e)

    try:
        get_supabase_client()
    except Exception as e:
        logger.warning("Supabase notice: %s", e)

    logger.info("Student Dashboard Backend ready on port %d!", settings.PORT)
    yield
    logger.info("Student Dashboard Backend shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Dedicated FastAPI & Supabase backend for SSGMCE Student Dashboard",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

origins = settings.CORS_ORIGINS
allowed_origins = origins if isinstance(origins, list) else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(student_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
def root():
    return {
        "success": True,
        "name": settings.PROJECT_NAME,
        "role": "student",
        "student": "Shivam Sanjay Aghao (308637)",
        "docs": "/docs",
        "status": "online"
    }

@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "framework": "FastAPI",
        "database": "Supabase PostgreSQL Ready"
    }
