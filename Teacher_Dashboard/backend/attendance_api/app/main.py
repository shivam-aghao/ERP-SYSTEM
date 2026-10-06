import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base, SessionLocal, get_supabase_client
from app.models.db_models import *
from app.services.seed_service import seed_database
from app.api.v1 import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("erp_fastapi")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed default data
    logger.info("Initializing SSGMCE Faculty Attendance ERP backend...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
        
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
    except Exception as e:
        logger.error("Error during database initialization/seeding: %s", e)

    # Initialize Supabase client
    try:
        get_supabase_client()
    except Exception as e:
        logger.warning("Supabase client connection notice: %s", e)

    logger.info("FastAPI backend is ready to accept requests on port %d!", settings.PORT)
    yield
    logger.info("FastAPI backend shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="High-performance FastAPI & Supabase backend for SSGMCE Faculty Attendance ERP",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
origins = settings.CORS_ORIGINS
if isinstance(origins, list):
    allowed_origins = origins
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception at %s %s: %s", request.method, request.url, str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "code": 500,
            "message": "Internal server error occurred",
            "error": {
                "code": 500,
                "message": str(exc)
            }
        }
    )

@app.get("/", tags=["Health"])
def root():
    return {
        "success": True,
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "status": "online"
    }

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "framework": "FastAPI",
        "database": "Supabase / PostgreSQL Ready",
        "service": settings.PROJECT_NAME
    }
