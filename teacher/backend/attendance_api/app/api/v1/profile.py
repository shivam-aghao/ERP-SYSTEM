from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.db_models import Teacher, Notification, ClassCard
from app.models.schema import ProfileUpdate
from app.utils.response import success_response, error_response

router = APIRouter(tags=["Profile & Notifications"])

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
