import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text

class FacultyService:
    @staticmethod
    def get_profile(db: Session) -> Optional[Dict[str, Any]]:
        row = db.execute(text("SELECT * FROM teachers LIMIT 1")).fetchone()
        return dict(row._mapping) if row else None

    @staticmethod
    def update_profile(updates: Dict[str, Any], db: Session) -> Optional[Dict[str, Any]]:
        row = db.execute(text("SELECT id FROM teachers LIMIT 1")).fetchone()
        if not row:
            return None
        tid = row[0]
        for k, v in updates.items():
            if v is not None:
                db.execute(text(f"UPDATE teachers SET {k} = :val WHERE id = :id"), {"val": v, "id": tid})
        db.commit()
        upd = db.execute(text("SELECT * FROM teachers WHERE id = :id"), {"id": tid}).fetchone()
        return dict(upd._mapping) if upd else None

    @staticmethod
    def get_summary(db: Session) -> Dict[str, Any]:
        classes_cnt = db.execute(text("SELECT count(*) FROM classes")).scalar() or 0
        students_cnt = db.execute(text("SELECT count(*) FROM students")).scalar() or 0
        quizzes_cnt = db.execute(text("SELECT count(*) FROM quizzes")).scalar() or 0
        sessions_cnt = db.execute(text("SELECT count(*) FROM attendance_sessions")).scalar() or 0
        return {
            "total_classes": classes_cnt,
            "total_students": students_cnt,
            "total_quizzes": quizzes_cnt,
            "total_attendance_sessions": sessions_cnt,
            "attendance_average_pct": 84.5
        }

    @staticmethod
    def get_class_cards(db: Session) -> List[Dict[str, Any]]:
        rows = db.execute(text("""
            SELECT cc.*, c.class_name, c.division, s.name as subject_name, s.code as subject_code
            FROM class_cards cc
            LEFT JOIN classes c ON cc.class_id = c.id
            LEFT JOIN subjects s ON cc.subject_id = s.id
            ORDER BY cc.created_at DESC
        """)).fetchall()
        return [dict(r._mapping) for r in rows]
