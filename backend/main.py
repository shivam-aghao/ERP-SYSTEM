"""
================================================================================
SSGMCE COLLEGE ERP — UNIFIED AUTONOMOUS ENTERPRISE BACKEND
Institution: Shri Sant Gajanan Maharaj College of Engineering, Shegaon
Clean Canonical API Architecture under /api/v1:
  - /api/v1/auth/...
  - /api/v1/students/...
  - /api/v1/teachers/...
  - /api/v1/admin/...
  - /api/v1/attendance/...
  - /api/v1/timetable/...
  - /api/v1/quizzes/...
  - /api/v1/attempts/...
  - /api/v1/results/...
  - /api/v1/fees/...
  - /api/v1/documents/...
  - /api/v1/notifications/...
================================================================================
"""

import os
import sys
import logging
from typing import Optional, Dict, Any

# Ensure project root is in sys.path so direct execution (python backend/main.py) works seamlessly
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_CURRENT_DIR)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)
if _CURRENT_DIR not in sys.path:
    sys.path.insert(0, _CURRENT_DIR)

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("ssgmce_erp_backend")

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text

# Core Database & Security Imports
from backend.config.settings import settings
from backend.config.database import engine, SessionLocal, get_db, get_supabase_client
from backend.utils.helpers import success_response, error_response

# Supabase Client Singleton
supabase_client = get_supabase_client()

# Initialize critical tables in Supabase PostgreSQL if not present
try:
    with engine.connect() as _con:
        _con.execute(text("""
            CREATE TABLE IF NOT EXISTS timetable_assessments (
                id VARCHAR(36) PRIMARY KEY,
                teacher_id VARCHAR(36),
                type VARCHAR(30) NOT NULL,
                subject VARCHAR(150) NOT NULL,
                title VARCHAR(250) NOT NULL,
                date VARCHAR(20) NOT NULL,
                start_time VARCHAR(10) NOT NULL,
                end_time VARCHAR(10) NOT NULL,
                link TEXT NOT NULL,
                class_code VARCHAR(50) DEFAULT '2R1',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        _con.commit()
except Exception as _e:
    logger.warning("Notice on timetable_assessments check: %s", _e)

# Initialize FastAPI Application
app = FastAPI(
    title="SSGMCE College ERP Autonomous Enterprise API",
    description="Unified Production Backend for Shri Sant Gajanan Maharaj College of Engineering, Shegaon",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ==============================================================================
# STANDARD ERROR & EXCEPTION HANDLING
# Standard format:
# {
#   "success": false,
#   "data": null,
#   "error": {
#     "code": "ERROR_CODE",
#     "message": "Human-readable message"
#   }
# }
# ==============================================================================

@app.exception_handler(HTTPException)
async def standard_http_exception_handler(request: Request, exc: HTTPException):
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_SERVER_ERROR"
    }
    err_code = code_map.get(exc.status_code, "ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": err_code,
                "message": exc.detail
            },
            "detail": exc.detail,
            "code": exc.status_code,
            "message": exc.detail
        }
    )


@app.exception_handler(RequestValidationError)
async def standard_validation_exception_handler(request: Request, exc: RequestValidationError):
    err_msg = "; ".join([f"{'.'.join(str(l) for l in err['loc'])}: {err['msg']}" for err in exc.errors()])
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": err_msg
            },
            "detail": exc.errors(),
            "code": 422,
            "message": err_msg
        }
    )


# ==============================================================================
# SYSTEM HEALTH & ROOT ALIASES
# ==============================================================================

@app.get("/health", tags=["System Diagnostics"])
@app.get("/api/health", tags=["System Diagnostics"])
def health_check():
    return {
        "status": "healthy",
        "service": "SSGMCE College ERP Unified Backend",
        "framework": "FastAPI + SQLAlchemy",
        "database": "connected",
        "database_type": "Cloud Supabase PostgreSQL",
        "supabase": "connected" if supabase_client else "available",
        "supabase_url": settings.SUPABASE_URL,
        "port": 8000
    }


# ==============================================================================
# CANONICAL ROUTER INCLUSIONS UNDER /api/v1
# ==============================================================================

from backend.routes.auth import router as auth_router
from backend.routes.students import router as students_router
from backend.routes.teachers import router as teachers_router
from backend.routes.admin import router as admin_router
from backend.routes.attendance import router as attendance_router
from backend.routes.timetable import router as timetable_router
from backend.routes.quizzes import router as quizzes_router
from backend.routes.attempts import router as attempts_router
from backend.routes.results import router as results_router
from backend.routes.fees import router as fees_router
from backend.routes.documents import router as documents_router
from backend.routes.notifications import router as notifications_router
from backend.routes.master import router as master_router
from backend.routes.compat import router as compat_router

# Mount all canonical routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(students_router, prefix="/api/v1")
app.include_router(teachers_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(attendance_router, prefix="/api/v1")
app.include_router(timetable_router, prefix="/api/v1")
app.include_router(quizzes_router, prefix="/api/v1")
app.include_router(attempts_router, prefix="/api/v1")
app.include_router(results_router, prefix="/api/v1")
app.include_router(fees_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(master_router, prefix="/api/v1")
app.include_router(compat_router, prefix="/api/v1")

logger.info(
    "Standardized canonical routers mounted under /api/v1:\n"
    "  • /api/v1/auth\n"
    "  • /api/v1/students\n"
    "  • /api/v1/teachers\n"
    "  • /api/v1/admin\n"
    "  • /api/v1/attendance\n"
    "  • /api/v1/timetable\n"
    "  • /api/v1/quizzes\n"
    "  • /api/v1/attempts\n"
    "  • /api/v1/results\n"
    "  • /api/v1/fees\n"
    "  • /api/v1/documents\n"
    "  • /api/v1/notifications"
)


# ==============================================================================
# STATIC FILES & WEB APPLICATION SERVING
# ==============================================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ERP_ROOT = os.path.dirname(BASE_DIR)
FRONTEND_DIR = os.path.join(ERP_ROOT, "frontend")
HTML_DIR = os.path.join(FRONTEND_DIR, "html")


@app.get("/student", include_in_schema=False)
def student_route():
    return RedirectResponse(url="/student-dashboard.html")


@app.get("/teacher", include_in_schema=False)
def teacher_route():
    return RedirectResponse(url="/teacher-dashboard.html")


@app.get("/attendance", include_in_schema=False)
def attendance_route():
    return RedirectResponse(url="/teacher-dashboard.html#attendance")


@app.get("/attendance/roster", include_in_schema=False)
def attendance_roster_route():
    return RedirectResponse(url="/teacher-dashboard.html#attendance/roster")


@app.get("/teacher_dashboard.html", include_in_schema=False)
def teacher_dashboard_underscore():
    return RedirectResponse(url="/teacher-dashboard.html")


@app.get("/student_dashboard.html", include_in_schema=False)
def student_dashboard_underscore():
    return RedirectResponse(url="/student-dashboard.html")


@app.get("/admin_dashboard.html", include_in_schema=False)
def admin_dashboard_underscore():
    return RedirectResponse(url="/admin-dashboard.html")


if os.path.isdir(FRONTEND_DIR):
    css_dir = os.path.join(FRONTEND_DIR, "css")
    js_dir = os.path.join(FRONTEND_DIR, "js")
    img_dir = os.path.join(FRONTEND_DIR, "images")

    if os.path.isdir(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    if os.path.isdir(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")
    if os.path.isdir(img_dir):
        app.mount("/images", StaticFiles(directory=img_dir), name="images")

    if os.path.isdir(HTML_DIR):
        app.mount("/html", StaticFiles(directory=HTML_DIR, html=True), name="html")
        app.mount("/", StaticFiles(directory=HTML_DIR, html=True), name="frontend")
    else:
        app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

    logger.info("Mounted frontend static assets from %s and %s", FRONTEND_DIR, HTML_DIR)


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting SSGMCE College ERP Unified Backend on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)