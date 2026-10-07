from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text

class StudentService:
    @staticmethod
    def get_profile(student_code: str, db: Session) -> Optional[Dict[str, Any]]:
        row = db.execute(
            text("SELECT s.*, c.class_name, c.division FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.student_code = :c OR s.id = :c LIMIT 1"),
            {"c": student_code}
        ).fetchone()
        if not row:
            row = db.execute(text("SELECT s.*, c.class_name, c.division FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()
        if not row:
            return None
        m = dict(row._mapping)
        m["studentCode"] = m.get("student_code") or ""
        m["fullName"] = m.get("full_name") or ""
        m["rollNo"] = m.get("roll_no") or 0
        m["className"] = m.get("class_name") or ""
        return m

    @staticmethod
    def update_profile(student_code: str, updates: Dict[str, Any], db: Session) -> Optional[Dict[str, Any]]:
        for k, v in updates.items():
            if v is not None:
                db.execute(text(f"UPDATE students SET {k} = :val WHERE student_code = :sc OR id = :sc"), {"val": v, "sc": student_code})
        db.commit()
        return StudentService.get_profile(student_code, db)

    @staticmethod
    def get_overview(student_code: str, db: Session) -> Dict[str, Any]:
        st = StudentService.get_profile(student_code, db)
        return {
            "student": st or {},
            "current_semester": 4,
            "cgpa": 0.0,
            "attendance_pct": 0.0,
            "credits_earned": 0,
            "alerts_count": 0
        }

    @staticmethod
    def get_academic_metrics(student_code: str, db: Session) -> List[Dict[str, Any]]:
        rows = db.execute(text("SELECT * FROM academic_metrics WHERE student_code = :code OR student_code IS NULL LIMIT 10"), {"code": student_code}).fetchall()
        return [dict(r._mapping) for r in rows] if rows else []
