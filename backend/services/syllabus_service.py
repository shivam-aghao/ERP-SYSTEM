from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text

class SyllabusService:
    @staticmethod
    def get_syllabus(subject_id: Optional[str], db: Session) -> List[Dict[str, Any]]:
        clause = "WHERE subject_id = :sid" if subject_id else ""
        params = {"sid": subject_id} if subject_id else {}
        rows = db.execute(text(f"SELECT * FROM subject_syllabus {clause}"), params).fetchall()
        return [dict(r._mapping) for r in rows]

    @staticmethod
    def get_timetable(day: Optional[str], db: Session) -> List[Dict[str, Any]]:
        clause = "WHERE day_of_week = :d" if day else ""
        params = {"d": day} if day else {}
        rows = db.execute(text(f"SELECT * FROM timetable_entries {clause} ORDER BY period_number ASC"), params).fetchall()
        return [dict(r._mapping) for r in rows]
