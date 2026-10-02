from typing import Any, Dict, List, Optional
from pydantic import BaseModel

# Profile
class StudentProfileOut(BaseModel):
    id: str
    rollNo: int
    studentCode: str
    fullName: str
    email: str
    department: str
    className: str
    division: str
    semester: int
    academicYear: str
    prn: str
    caste: str
    isEmployeeWard: bool
    phone: str
    cgpa: float
    sgpa: float
    attendanceRate: float
    avatarUrl: str

# Timetable
class TimetablePeriodOut(BaseModel):
    num: str
    time: str
    code: str
    name: str
    venue: str
    teacher: str
    status: str
    statusClass: str
    att: str
    isCompleted: bool = False
    isActiveNow: bool = False
    isCritical: bool = False

class TimetableDayOut(BaseModel):
    day: str
    dayLabel: str
    periods: List[TimetablePeriodOut]

# Syllabus
class SubjectSyllabusOut(BaseModel):
    id: str
    subjectCode: str
    subjectName: str
    credits: int
    facultyName: str
    facultyDesignation: str
    facultyEmail: Optional[str] = None
    facultyCabin: str
    syllabusProgress: int
    curriculumPdfUrl: str

# Fees
class FeeSummaryOut(BaseModel):
    academicYear: str
    semester: int
    tuitionFee: float
    developmentFee: float
    examFee: float
    gymkhanaFee: float
    totalFee: float
    paidAmount: float
    dueAmount: float
    status: str

class FeePaymentIntent(BaseModel):
    amount: float
    paymentMode: str = "Online Net Banking"

class FeeReceiptOut(BaseModel):
    id: str
    receiptNo: str
    transactionId: str
    paymentDate: str
    amount: float
    paymentMode: str
    status: str
    downloadUrl: str

# E-Learning
class AssignmentOut(BaseModel):
    id: str
    subjectCode: str
    subjectName: str
    title: str
    dueDate: str
    totalMarks: int
    submissionStatus: str
    grade: Optional[str] = None

class AssignmentSubmit(BaseModel):
    assignmentId: str
    fileUrl: str
    comments: Optional[str] = None

class EContentOut(BaseModel):
    id: str
    subjectCode: str
    subjectName: str
    title: str
    contentType: str
    fileUrl: str
    uploadedAt: str

class QuizOut(BaseModel):
    id: str
    subjectCode: str
    title: str
    durationMins: int
    totalMarks: int
    obtainedMarks: int
    status: str

# Change Info
class ChangeInfoSubmit(BaseModel):
    fieldName: str
    requestedValue: str
    reason: str
    proofDocumentUrl: Optional[str] = "#"

class ChangeInfoOut(BaseModel):
    id: str
    fieldName: str
    currentValue: str
    requestedValue: str
    reason: str
    status: str
    submittedAt: str

# Updation Info
class UpdationInfoSubmit(BaseModel):
    category: str
    title: str
    eventDate: str
    organization: str
    description: str
    certificateUrl: Optional[str] = "#"

class UpdationInfoOut(BaseModel):
    id: str
    category: str
    title: str
    eventDate: str
    organization: str
    description: str
    aictePoints: int
    status: str

# D-Wallet
class DocumentUpload(BaseModel):
    documentName: str
    category: str = "ACADEMIC"
    fileUrl: str = "#"

class DocumentOut(BaseModel):
    id: str
    documentName: str
    category: str
    fileUrl: str
    fileSize: str
    isVerified: bool
    uploadDate: str

# Examination
class ExamMarkOut(BaseModel):
    id: str
    subjectCode: str
    subjectName: str
    cie1Score: float
    cie2Score: float
    taScore: float
    totalInternal: float
    grade: str
    gradePoints: float

class RevaluationSubmit(BaseModel):
    subjectCode: str
    subjectName: str
    applicationType: str = "REVALUATION"

class RevaluationOut(BaseModel):
    id: str
    subjectCode: str
    subjectName: str
    examSession: str
    currentMarks: float
    applicationType: str
    status: str
    appliedAt: str

# Extended Models for Fortified Supabase Integration
class StudentProfileUpdate(BaseModel):
    phone: Optional[str] = None
    primaryMobile: Optional[str] = None
    emergencyContact: Optional[str] = None
    permanentAddress: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    avatarUrl: Optional[str] = None
    caste: Optional[str] = None
    bloodGroup: Optional[str] = None
    hostelStatus: Optional[str] = None

class AcademicMetricsOut(BaseModel):
    studentCode: str
    academicYear: str
    currentSemester: int
    cgpa: float
    latestSgpa: float
    sem1Sgpa: float
    sem2Sgpa: float
    sem3Sgpa: float
    overallAttendancePct: float
    earnedCredits: int
    totalCredits: int
    academicStanding: str

class NotificationItem(BaseModel):
    id: str
    title: str
    message: str
    category: str
    severity: str = "info"
    source: str = "Examination Cell"
    isRead: bool = False
    createdAt: Optional[str] = None

class StudentOverviewOut(BaseModel):
    student: Dict[str, Any]
    metrics: Dict[str, Any]
    attendanceSummary: Dict[str, Any]
    todayTimetable: List[Dict[str, Any]]
    recentNotifications: List[Dict[str, Any]]
    systemStatus: Dict[str, Any]

class HealthStatusOut(BaseModel):
    status: str
    service: str
    version: str
    supabaseConnected: bool
    supabaseUrl: str
    database: str
    latencyMs: Optional[float] = None
