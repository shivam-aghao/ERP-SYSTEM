from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.config.database import get_db
from backend.services.syllabus_service import SyllabusService
from backend.utils.helpers import success_response

router = APIRouter(tags=["Curriculum & Syllabus"])

@router.get("/student/syllabus")
@router.get("/syllabus")
def get_syllabus(subject_id: Optional[str] = None, db: Session = Depends(get_db)):
    data = SyllabusService.get_syllabus(subject_id, db)
    return success_response(data)

@router.get("/student/timetable")
@router.get("/timetable")
def get_timetable(day: Optional[str] = None, db: Session = Depends(get_db)):
    data = SyllabusService.get_timetable(day, db)
    return success_response(data)
