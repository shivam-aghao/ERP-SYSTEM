from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field

# ==============================================================================
# AUTH SCHEMAS
# ==============================================================================
class LoginRequest(BaseModel):
    employeeCode: Optional[str] = None
    email: Optional[str] = None
    password: str

class RefreshTokenRequest(BaseModel):
    refreshToken: str

class UserOut(BaseModel):
    id: str
    name: str
    empCode: str
    designation: str
    department: str
    email: str
    avatar: str

class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = "bearer"
    user: UserOut

# ==============================================================================
# PROFILE & NOTIFICATION SCHEMAS
# ==============================================================================
class ProfileOut(BaseModel):
    id: str
    fullName: str
    empCode: str
    email: str
    designation: str
    department: str
    departmentName: str
    phone: Optional[str] = None
    avatar: str
    unreadNotifications: int = 0
    activeCardsCount: int = 0

class ProfileUpdate(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    avatar: Optional[str] = None

class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    type: str = "INFO"
    isRead: bool = False
    createdAt: str

# ==============================================================================
# MASTER DATA SCHEMAS
# ==============================================================================
class DepartmentOut(BaseModel):
    id: str
    code: str
    name: str
    icon: Optional[str] = "💻"
    classesCount: int = 4
    color: Optional[str] = "#0B5CAD"
    description: Optional[str] = None

class ClassOut(BaseModel):
    id: str
    name: str
    year: str
    division: str
    studentCount: int
    room: Optional[str] = None
    department: str

class SubjectOut(BaseModel):
    id: str
    code: str
    name: str
    semester: int
    type: str = "THEORY"
    department: str

# ==============================================================================
# CLASS CARDS SCHEMAS
# ==============================================================================
class ClassCardCreate(BaseModel):
    department: str
    classId: str
    subjectCode: str
    subjectName: Optional[str] = None
    roomNumber: Optional[str] = "Hall C"
    colorGradient: Optional[str] = "from-blue-600 to-indigo-700"

class ClassCardUpdate(BaseModel):
    roomNumber: Optional[str] = None
    colorGradient: Optional[str] = None
    sortOrder: Optional[int] = None

class ClassCardOut(BaseModel):
    id: str
    teacher_id: str
    department: str
    department_name: str
    class_: str = Field(alias="class")
    class_id: Optional[str] = None
    subject_code: str
    subject_name: str
    room_number: Optional[str] = "Hall C"
    color_gradient: Optional[str] = "from-blue-600 to-indigo-700"
    created_at: str

    class Config:
        populate_by_name = True

# ==============================================================================
# STUDENT & ROSTER SCHEMAS
# ==============================================================================
class StudentRosterOut(BaseModel):
    id: str
    rollNo: int
    studentCode: str
    name: str
    isProvisional: bool = False
    avatarUrl: Optional[str] = None
    attendancePercentage: float = 85.0
    recentHistory: List[str] = []

# ==============================================================================
# ATTENDANCE SCHEMAS
# ==============================================================================
class AttendanceRecordIn(BaseModel):
    studentId: Optional[str] = None
    rollNo: Optional[Union[int, str]] = None
    status: str = "PRESENT"
    remarks: Optional[str] = None

class AttendanceDraftSave(BaseModel):
    department: str
    classId: str
    subjectCode: str
    subjectName: Optional[str] = None
    date: str
    period: Optional[Union[int, str]] = "1"
    topic: Optional[str] = ""
    teachingAid: Optional[str] = "Blackboard / PPT"
    remark: Optional[str] = ""
    records: List[AttendanceRecordIn] = []

class AttendanceSubmitRequest(BaseModel):
    department: str
    classId: str
    subjectCode: str
    subjectName: Optional[str] = None
    date: str
    period: Optional[Union[int, str]] = "1"
    sessionType: Optional[str] = "REGULAR"
    topic: Optional[str] = ""
    teachingAid: Optional[str] = "Blackboard / PPT"
    remark: Optional[str] = ""
    records: List[AttendanceRecordIn]

class AttendanceRecordDetailOut(BaseModel):
    id: str
    studentId: str
    rollNo: int
    studentCode: str
    fullName: str
    status: str
    remarks: Optional[str] = None

class AttendanceSessionOut(BaseModel):
    id: str
    teacherId: str
    teacherName: str
    department: str
    departmentName: str
    classId: str
    subjectCode: str
    subjectName: str
    subject: str
    date: str
    period: Union[int, str]
    sessionType: str = "REGULAR"
    topic: Optional[str] = ""
    remark: Optional[str] = ""
    status: str = "SUBMITTED"
    totalStudents: int = 0
    presentCount: int = 0
    absentCount: int = 0
    attendanceRate: float = 0.0
    submittedAt: Optional[str] = None
    records: Optional[List[AttendanceRecordDetailOut]] = None

# ==============================================================================
# REPORT SCHEMAS
# ==============================================================================
class ClassStatsOut(BaseModel):
    classId: str
    className: str
    department: str
    totalStudents: int
    totalSessions: int
    overallAttendanceRate: float
    defaultersCount: int
    topAttendees: List[Dict[str, Any]] = []
    defaulters: List[Dict[str, Any]] = []
