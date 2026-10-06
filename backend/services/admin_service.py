from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text

class AdminService:
    @staticmethod
    def get_system_stats(db: Session) -> Dict[str, Any]:
        students = db.execute(text("SELECT count(*) FROM students")).scalar() or 0
        teachers = db.execute(text("SELECT count(*) FROM teachers")).scalar() or 0
        classes = db.execute(text("SELECT count(*) FROM classes")).scalar() or 0
        quizzes = db.execute(text("SELECT count(*) FROM quizzes")).scalar() or 0
        return {
            "total_students": students,
            "total_teachers": teachers,
            "total_classes": classes,
            "total_quizzes": quizzes
        }
