from typing import Optional
from pydantic import BaseModel

class TeacherProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    cabin_number: Optional[str] = None
    designation: Optional[str] = None

class ClassCardCreate(BaseModel):
    class_id: str
    subject_id: str
    academic_year: str = "2026-27"
    semester: str = "Odd"

class ClassCardUpdate(BaseModel):
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    is_active: Optional[bool] = None
