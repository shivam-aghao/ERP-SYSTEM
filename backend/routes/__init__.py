from backend.routes.auth import router as auth_router
from backend.routes.student import router as student_router
from backend.routes.faculty import router as faculty_router
from backend.routes.attendance import router as attendance_router
from backend.routes.quiz import router as quiz_router
from backend.routes.syllabus import router as syllabus_router
from backend.routes.profile import router as profile_router
from backend.routes.admin import router as admin_router

__all__ = [
    "auth_router", "student_router", "faculty_router", "attendance_router",
    "quiz_router", "syllabus_router", "profile_router", "admin_router"
]
