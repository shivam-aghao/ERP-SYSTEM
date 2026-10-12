"""
================================================================================
SSGMCE COLLEGE ERP — CANONICAL MASTER DATA & SYSTEM DIAGNOSTICS ROUTER
Namespace: /api/v1/... (Master Data & Institutional Metadata)
================================================================================
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.config.database import get_db, get_supabase_client
from backend.config.settings import settings
from backend.services.syllabus_service import SyllabusService
from backend.utils.helpers import success_response

router = APIRouter(tags=["Master Data & Diagnostics"])


@router.get("/health")
def health_check():
    """GET /api/v1/health - System health check."""
    supabase_client = get_supabase_client()
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


@router.get("/system/config")
def get_public_system_config():
    """
    GET /api/v1/system/config
    Returns public client configuration for frontend initialization.
    NEVER exposes database passwords, service-role keys, or server secrets.
    """
    return success_response({
        "supabase_url": settings.SUPABASE_URL,
        "supabase_anon_key": settings.SUPABASE_ANON_KEY,
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION
    })


@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    """GET /api/v1/departments - Academic departments list."""
    rows = db.execute(text("SELECT id, code, name, name as dept_name, icon, classes_count, description FROM departments ORDER BY name ASC")).fetchall()
    return success_response([dict(r._mapping) for r in rows])


@router.get("/classes")
def get_classes(db: Session = Depends(get_db)):
    """GET /api/v1/classes - Academic class roster list."""
    rows = db.execute(text("SELECT * FROM classes ORDER BY class_name ASC")).fetchall()
    return success_response([dict(r._mapping) for r in rows])


@router.get("/subjects")
def get_subjects(db: Session = Depends(get_db)):
    """GET /api/v1/subjects - Course curriculum subjects list."""
    rows = db.execute(text("SELECT id, department_id, code, name, type, credits, code as subject_code, name as subject_name FROM subjects ORDER BY name ASC")).fetchall()
    return success_response([dict(r._mapping) for r in rows])


@router.get("/syllabus")
def get_syllabus(subject_id: Optional[str] = None, db: Session = Depends(get_db)):
    """GET /api/v1/syllabus - Syllabus unit details for academic subjects."""
    data = SyllabusService.get_syllabus(subject_id, db)
    return success_response(data)

