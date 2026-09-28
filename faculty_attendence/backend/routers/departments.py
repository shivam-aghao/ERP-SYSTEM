from fastapi import APIRouter
from database import db
from schemas import ApiResponse

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("")
@router.get("/")
def get_departments():
    try:
        res = db.table("departments").select("*").order("code").execute()
        depts = res.data if res.data else []
    except Exception:
        depts = []

    if not depts:
        depts = [
            {"code": "CSE", "name": "Computer Science & Engineering", "icon": "💻", "classes_count": 4, "color": "#0B5CAD"},
            {"code": "IT", "name": "Information Technology", "icon": "🌐", "classes_count": 4, "color": "#1565C0"},
            {"code": "MECH", "name": "Mechanical Engineering", "icon": "⚙️", "classes_count": 4, "color": "#37474F"},
            {"code": "EE", "name": "Electrical Engineering", "icon": "⚡", "classes_count": 4, "color": "#E65100"},
            {"code": "ENTC", "name": "Electronics & Telecommunication", "icon": "📡", "classes_count": 4, "color": "#4527A0"},
            {"code": "ASH", "name": "Applied Sciences & Humanities", "icon": "🔬", "classes_count": 4, "color": "#00A6D6"}
        ]

    return ApiResponse(statusCode=200, data=depts, message="Departments retrieved", success=True)
