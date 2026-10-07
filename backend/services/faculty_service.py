import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text

class FacultyService:
    @staticmethod
    def get_profile(db: Session, emp_code: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if emp_code:
            row = db.execute(text("""
                SELECT t.*, d.name as department_name, d.code as department_code
                FROM teachers t
                LEFT JOIN departments d ON t.department_id = d.id
                WHERE LOWER(t.emp_code) = LOWER(:code) 
                   OR t.id = :code 
                   OR LOWER(t.email) = LOWER(:code)
                LIMIT 1
            """), {"code": emp_code}).fetchone()
        else:
            row = db.execute(text("""
                SELECT t.*, d.name as department_name, d.code as department_code
                FROM teachers t
                LEFT JOIN departments d ON t.department_id = d.id
                LIMIT 1
            """)).fetchone()

        if not row:
            return None
        m = dict(row._mapping)
        m["fullName"] = m.get("full_name")
        m["empCode"] = m.get("emp_code")
        m["department"] = m.get("department_name") or m.get("department_code") or "Computer Science & Engineering"
        return m

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
        avg_att = db.execute(text("SELECT AVG(attendance_rate) FROM attendance_sessions")).scalar()
        avg_att_pct = round(float(avg_att), 1) if avg_att is not None else 0.0
        return {
            "total_classes": classes_cnt,
            "total_students": students_cnt,
            "total_quizzes": quizzes_cnt,
            "total_attendance_sessions": sessions_cnt,
            "attendance_average_pct": avg_att_pct
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
