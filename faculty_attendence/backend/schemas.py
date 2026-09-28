from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    statusCode: int = 200
    data: Optional[T] = None
    message: str = "Success"
    success: bool = True

class LoginRequest(BaseModel):
    employeeCode: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class CreateClassCardRequest(BaseModel):
    departmentCode: Optional[str] = None
    department: Optional[str] = None
    classCode: Optional[str] = None
    classId: Optional[str] = None
    subjectCode: str

class StudentAttendanceItem(BaseModel):
    id: Optional[str] = None
    studentId: Optional[str] = None
    name: Optional[str] = None
    rollNo: Optional[Any] = None
    prn: Optional[str] = None
    status: str = "PRESENT"
    history: Optional[List[Any]] = []

class SubmitAttendanceRequest(BaseModel):
    departmentCode: Optional[str] = None
    department: Optional[str] = None
    departmentName: Optional[str] = None
    classCode: Optional[str] = None
    classId: Optional[str] = None
    subjectCode: str
    subjectName: Optional[str] = None
    date: str
    dateFormatted: Optional[str] = None
    period: Optional[int] = 1
    timeSlot: Optional[str] = "09:00 AM - 10:00 AM"
    topicTaught: Optional[str] = "General Lecture"
    remark: Optional[str] = ""
    students: List[StudentAttendanceItem] = []
    totalStudents: Optional[int] = None
    presentCount: Optional[int] = None
    absentCount: Optional[int] = None
    percentage: Optional[Any] = None
