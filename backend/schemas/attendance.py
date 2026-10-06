from typing import List, Optional
from pydantic import BaseModel

class AttendanceDraftRequest(BaseModel):
    class_id: str
    subject_id: str
    session_date: str
    period_number: int = 1
    session_type: str = "theory"
    present_student_ids: List[str] = []
    absent_student_ids: List[str] = []

class AttendanceSubmitRequest(BaseModel):
    class_id: str
    subject_id: str
    session_date: str
    period_number: int = 1
    session_type: str = "theory"
    present_student_ids: List[str] = []
    absent_student_ids: List[str] = []
