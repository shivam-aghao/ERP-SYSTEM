from backend.services.auth_service import AuthService
from backend.services.student_service import StudentService
from backend.services.faculty_service import FacultyService
from backend.services.attendance_service import AttendanceService
from backend.services.quiz_service import QuizService
from backend.services.syllabus_service import SyllabusService
from backend.services.admin_service import AdminService

__all__ = [
    "AuthService", "StudentService", "FacultyService", "AttendanceService",
    "QuizService", "SyllabusService", "AdminService"
]
