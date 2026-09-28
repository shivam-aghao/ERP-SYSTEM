from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from config import settings
from database import db
from schemas import ApiResponse, CreateClassCardRequest

router = APIRouter(prefix="/cards", tags=["Class Cards"])

@router.get("")
@router.get("/")
def get_teacher_cards(x_teacher_id: Optional[str] = Header(None)):
    teacher_id = x_teacher_id or settings.DEFAULT_TEACHER_ID
    try:
        res = db.table("teacher_class_cards").select("*").order("created_at").execute()
        raw_cards = res.data if res.data else []
    except Exception as e:
        raw_cards = []

    # Map cards to frontend format
    cards = []
    subject_map = {
        "CS305": "Database Management",
        "CS303": "Java Programming",
        "CS302": "Data Structures",
        "CS304": "Operating Systems"
    }
    for c in raw_cards:
        sub_code = c.get("subject_code", "")
        dept = c.get("department_code", "CSE")
        cards.append({
            "id": c.get("id"),
            "teacher_id": c.get("teacher_id", teacher_id),
            "department": dept,
            "department_name": "Computer Science & Engineering" if dept == "CSE" else dept,
            "class": c.get("class_code"),
            "class_name": c.get("class_code"),
            "subject_code": sub_code,
            "subject_name": subject_map.get(sub_code, sub_code),
            "subject_type": "Theory",
            "created_at": c.get("created_at")
        })

    return ApiResponse(statusCode=200, data=cards, message="Class cards retrieved", success=True)

@router.post("")
@router.post("/")
def create_card(payload: CreateClassCardRequest, x_teacher_id: Optional[str] = Header(None)):
    teacher_id = x_teacher_id or settings.DEFAULT_TEACHER_ID
    dept = payload.departmentCode or payload.department or "CSE"
    cls = payload.classCode or payload.classId
    sub = payload.subjectCode

    if not cls or not sub:
        raise HTTPException(status_code=400, detail="Class and Subject are required")

    try:
        # Check duplicate
        existing = db.table("teacher_class_cards").select("id").eq("department_code", dept).eq("class_code", cls).eq("subject_code", sub).execute()
        if existing.data and len(existing.data) > 0:
            raise HTTPException(status_code=409, detail="Duplicate card: You already have this class card configured")

        res = db.table("teacher_class_cards").insert({
            "teacher_id": teacher_id,
            "department_code": dept,
            "class_code": cls,
            "subject_code": sub
        }).execute()
        new_card = res.data[0] if res.data else {}
        return ApiResponse(statusCode=201, data=new_card, message="Class card created successfully", success=True)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{card_id}")
def delete_card(card_id: str):
    try:
        db.table("teacher_class_cards").delete().eq("id", card_id).execute()
        return ApiResponse(statusCode=200, data=None, message="Class card removed successfully", success=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
