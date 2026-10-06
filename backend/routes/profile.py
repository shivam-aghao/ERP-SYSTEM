from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.config.database import get_db
from backend.utils.helpers import success_response

router = APIRouter(tags=["Notifications & General Profile"])

@router.get("/student/notifications")
@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20")).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@router.patch("/student/notifications/{id}/read")
@router.post("/student/notifications/{id}/read")
@router.patch("/notifications/{id}/read")
def mark_notification_read(id: str, db: Session = Depends(get_db)):
    db.execute(text("UPDATE notifications SET is_read = 1 WHERE id = :id"), {"id": id})
    db.commit()
    return success_response({"id": id, "is_read": True}, "Marked as read")
