from backend.schemas.auth import LoginRequest, TokenResponse
from backend.schemas.student import StudentProfileUpdate, ChangeInfoSubmit, UpdationInfoSubmit, DocumentUpload, FeePaymentIntent
from backend.schemas.faculty import TeacherProfileUpdate, ClassCardCreate, ClassCardUpdate
from backend.schemas.attendance import AttendanceDraftRequest, AttendanceSubmitRequest
from backend.schemas.quiz import (
    QuestionOptionInput, QuestionBankCreate, QuizCreateSchema, QuizUpdateSchema,
    AnswerSubmissionItem, QuizSubmitRequest, SecurityEventRequest
)
from backend.schemas.syllabus import SyllabusUnitCreate, TimetableCreate
from backend.schemas.admin import AdminActionRequest

__all__ = [
    "LoginRequest", "TokenResponse",
    "StudentProfileUpdate", "ChangeInfoSubmit", "UpdationInfoSubmit", "DocumentUpload", "FeePaymentIntent",
    "TeacherProfileUpdate", "ClassCardCreate", "ClassCardUpdate",
    "AttendanceDraftRequest", "AttendanceSubmitRequest",
    "QuestionOptionInput", "QuestionBankCreate", "QuizCreateSchema", "QuizUpdateSchema",
    "AnswerSubmissionItem", "QuizSubmitRequest", "SecurityEventRequest",
    "SyllabusUnitCreate", "TimetableCreate", "AdminActionRequest"
]
