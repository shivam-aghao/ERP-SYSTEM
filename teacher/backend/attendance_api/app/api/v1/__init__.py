from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.profile import router as profile_router
from app.api.v1.master_data import router as master_router
from app.api.v1.cards import router as cards_router
from app.api.v1.students import router as students_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.reports import router as reports_router
from app.api.v1.quiz import router as quiz_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(master_router)
api_router.include_router(cards_router)
api_router.include_router(students_router)
api_router.include_router(attendance_router)
api_router.include_router(reports_router)
api_router.include_router(quiz_router)
