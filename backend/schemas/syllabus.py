from typing import Optional
from pydantic import BaseModel

class SyllabusUnitCreate(BaseModel):
    subject_id: str
    unit_number: int
    unit_title: str
    content: Optional[str] = None
    hours: int = 8

class TimetableCreate(BaseModel):
    class_id: str
    day_of_week: str
    period_number: int
    subject_name: str
    teacher_name: Optional[str] = None
    room: Optional[str] = "Hall 101"
