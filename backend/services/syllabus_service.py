from typing import Optional, Dict, Any, List
import json
import logging
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.config.database import get_supabase_client

logger = logging.getLogger("ssgmce_erp_backend.syllabus")

class SyllabusService:
    @staticmethod
    def get_syllabus(subject_id: Optional[str] = None, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        """
        Retrieves dynamic curriculum catalog and syllabus specifications.
        Prioritizes live Supabase Cloud PostgreSQL, with local SQL fallback.
        """
        # 1. Attempt live fetch from Supabase Cloud
        try:
            sb = get_supabase_client()
            if sb:
                query = sb.table("subject_syllabus").select("*")
                if subject_id:
                    query = query.or_(f"subject_code.eq.{subject_id},id.eq.{subject_id}")
                resp = query.order("subject_code").execute()

                if resp.data and len(resp.data) > 0:
                    # Fetch units
                    u_query = sb.table("curriculum_units").select("*")
                    if subject_id:
                        u_query = u_query.eq("subject_code", subject_id)
                    u_resp = u_query.order("unit_number").execute()
                    
                    unit_map = {}
                    for u in (u_resp.data or []):
                        sc = u.get("subject_code")
                        unit_map.setdefault(sc, []).append(u)

                    results = []
                    for m in resp.data:
                        code = m.get("subject_code")
                        raw_units = unit_map.get(code, [])
                        
                        units = []
                        for u in sorted(raw_units, key=lambda x: x.get("unit_number", 0)):
                            topics = u.get("topics")
                            if isinstance(topics, str):
                                try:
                                    topics = json.loads(topics)
                                except Exception:
                                    pass
                            if not isinstance(topics, list):
                                topics = []
                            units.append({
                                "unit_number": u.get("unit_number"),
                                "unit_title": u.get("unit_title"),
                                "title": u.get("unit_title"),
                                "planned_hours": u.get("planned_hours"),
                                "hours": u.get("planned_hours"),
                                "topics": topics
                            })

                        # Format outcomes and books
                        outcomes = m.get("course_outcomes") or []
                        if isinstance(outcomes, str):
                            try: outcomes = json.loads(outcomes)
                            except Exception: outcomes = []

                        books = m.get("reference_books") or []
                        if isinstance(books, str):
                            try: books = json.loads(books)
                            except Exception: books = []

                        prog = m.get("syllabus_progress") or 75

                        results.append({
                            **m,
                            "units": units,
                            "outcomes": outcomes,
                            "course_outcomes": outcomes,
                            "books": books,
                            "reference_books": books,
                            "progress": prog,
                            "syllabusProgress": prog,
                            "syllabus_progress": prog,
                            "subjectCode": code,
                            "subjectName": m.get("subject_name"),
                            "code": code,
                            "name": m.get("subject_name"),
                            "type": m.get("subject_type") or "Core",
                            "faculty": m.get("faculty_name") or "Faculty Advisor"
                        })
                    if results:
                        return results
        except Exception as e:
            logger.warning("Supabase live syllabus retrieval failed, falling back to local database: %s", e)

        # 2. Local database session fallback
        if not db:
            from backend.config.database import SessionLocal
            db = SessionLocal()

        clause = "WHERE subject_code = :sid OR id = :sid" if subject_id else ""
        params = {"sid": subject_id} if subject_id else {}
        rows = db.execute(text(f"SELECT * FROM subject_syllabus {clause} ORDER BY subject_code ASC"), params).fetchall()
        result = []
        for r in rows:
            m = dict(r._mapping)
            for field in ["course_outcomes", "reference_books"]:
                val = m.get(field)
                if isinstance(val, str):
                    try:
                        m[field] = json.loads(val)
                    except Exception:
                        pass
                if m.get(field) is None:
                    m[field] = []

            code = m.get("subject_code")
            u_rows = db.execute(
                text("SELECT unit_number, unit_title, planned_hours, topics FROM curriculum_units WHERE subject_code = :sc ORDER BY unit_number ASC"),
                {"sc": code}
            ).fetchall()
            units = []
            for u in u_rows:
                um = dict(u._mapping)
                if isinstance(um.get("topics"), str):
                    try:
                        um["topics"] = json.loads(um["topics"])
                    except Exception:
                        pass
                if not isinstance(um.get("topics"), list):
                    um["topics"] = []
                um["title"] = um.get("unit_title")
                um["hours"] = um.get("planned_hours")
                units.append(um)

            prog = m.get("syllabus_progress") or 75
            m["units"] = units
            m["progress"] = prog
            m["syllabusProgress"] = prog
            m["syllabus_progress"] = prog
            m["subjectCode"] = m.get("subject_code")
            m["subjectName"] = m.get("subject_name")
            m["code"] = m.get("subject_code")
            m["name"] = m.get("subject_name")
            m["type"] = m.get("subject_type") or "Core"
            m["faculty"] = m.get("faculty_name") or "Faculty Advisor"
            m["outcomes"] = m.get("course_outcomes") or []
            m["books"] = m.get("reference_books") or []
            result.append(m)
        return result

    @staticmethod
    def get_timetable(day: Optional[str] = None, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        # 1. Try Supabase
        try:
            sb = get_supabase_client()
            if sb:
                query = sb.table("timetable_entries").select("*")
                if day:
                    query = query.eq("day_of_week", day)
                resp = query.order("period_number").execute()
                if resp.data and len(resp.data) > 0:
                    return resp.data
        except Exception as e:
            logger.info("Supabase timetable fetch fallback notice: %s", e)

        # 2. Local fallback
        if not db:
            from backend.config.database import SessionLocal
            db = SessionLocal()
        clause = "WHERE day_of_week = :d" if day else ""
        params = {"d": day} if day else {}
        rows = db.execute(text(f"SELECT * FROM timetable_entries {clause} ORDER BY period_number ASC"), params).fetchall()
        return [dict(r._mapping) for r in rows]
