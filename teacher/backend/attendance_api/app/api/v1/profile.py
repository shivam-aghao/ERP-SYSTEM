from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.db_models import Teacher, Notification, ClassCard
from app.models.schema import ProfileUpdate
from app.utils.response import success_response, error_response

import logging
from app.database import get_supabase_client

logger = logging.getLogger("erp_fastapi")

router = APIRouter(tags=["Profile & Notifications"])

@router.get("/profile/active")
def get_active_faculty_profile(db: Session = Depends(get_db)):
    """
    Returns active faculty profile directly from Supabase / database without requiring token.
    Enables frontend to immediately sync dynamic teacher name and credentials.
    """
    # 1. Try Supabase table 'faculty'
    try:
        sb = get_supabase_client()
        if sb:
            res = sb.table("faculty").select("*").limit(1).execute()
            if res.data and len(res.data) > 0:
                row = res.data[0]
                return success_response(data={
                    "fullName": row.get("name") or "Dr. J.M.Patil",
                    "empCode": row.get("employee_id") or "FAC-CSE-1048",
                    "designation": row.get("title") or "Associate Professor",
                    "department": row.get("department_code") or "CSE",
                    "departmentName": "Computer Science & Engineering",
                    "email": row.get("email") or "jm.patil@ssgmce.ac.in",
                    "phone": row.get("phone") or "+91 98765 43210",
                    "avatar": row.get("avatar_initials") or "JP",
                    "source": "supabase"
                })
    except Exception as e:
        logger.warning("Supabase faculty query error: %s", e)

    # 2. Local database fallback
    teacher = db.query(Teacher).first()
    if teacher:
        dept_code = teacher.department.code if teacher.department else "CSE"
        dept_name = teacher.department.name if teacher.department else "Computer Science & Engineering"
        return success_response(data={
            "fullName": teacher.full_name,
            "empCode": teacher.emp_code,
            "designation": teacher.designation,
            "department": dept_code,
            "departmentName": dept_name,
            "email": teacher.email,
            "phone": teacher.phone or "+91 98765 43210",
            "avatar": teacher.avatar or "JP",
            "source": "database"
        })

    return error_response("Faculty profile not found in database", code=404)

@router.get("/profile")
def get_profile(current_user: Teacher = Depends(get_current_user), db: Session = Depends(get_db)):
    unread_count = db.query(Notification).filter_by(teacher_id=current_user.id, is_read=False).count()
    cards_count = db.query(ClassCard).filter_by(teacher_id=current_user.id).count()

    dept_code = current_user.department.code if current_user.department else "CSE"
    dept_name = current_user.department.name if current_user.department else "Computer Science & Engineering"

    return success_response(data={
        "id": current_user.id,
        "fullName": current_user.full_name,
        "empCode": current_user.emp_code,
        "email": current_user.email,
        "designation": current_user.designation,
        "department": dept_code,
        "departmentName": dept_name,
        "phone": current_user.phone or "+91 98765 43210",
        "avatar": current_user.avatar or "RS",
        "unreadNotifications": unread_count,
        "activeCardsCount": cards_count
    })

@router.put("/profile")
def update_profile(payload: ProfileUpdate, current_user: Teacher = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.fullName is not None:
        current_user.full_name = payload.fullName
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.designation is not None:
        current_user.designation = payload.designation
    if payload.avatar is not None:
        current_user.avatar = payload.avatar
    
    db.commit()
    db.refresh(current_user)

    return success_response(data={
        "id": current_user.id,
        "fullName": current_user.full_name,
        "phone": current_user.phone,
        "designation": current_user.designation,
        "avatar": current_user.avatar
    }, message="Profile updated successfully")

@router.get("/notifications")
def get_notifications(current_user: Teacher = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(Notification).filter_by(teacher_id=current_user.id).order_by(Notification.created_at.desc()).all()
    data = [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "isRead": n.is_read,
            "createdAt": n.created_at.isoformat() if n.created_at else ""
        }
        for n in notes
    ]
    return success_response(data=data)

@router.patch("/notifications/{id}/read")
def mark_notification_read(id: str, current_user: Teacher = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Notification).filter_by(id=id, teacher_id=current_user.id).first()
    if not note:
        return error_response("Notification not found", code=404)
    note.is_read = True
    db.commit()
    return success_response(message="Notification marked as read")
