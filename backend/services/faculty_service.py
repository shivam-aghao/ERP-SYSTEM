import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text

DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

TIME_SLOT_HEADERS = [
    "Day",
    "11:00 - 12:00 PM",
    "12:00 - 01:00 PM",
    "01:15 - 02:15 PM",
    "02:15 - 03:15 PM",
    "03:45 - 04:45 PM",
    "04:45 - 05:45 PM"
]

class FacultyService:
    @staticmethod
<<<<<<< HEAD
    def get_teacher_by_identifier(identifier: Optional[str], db: Session) -> Optional[Dict[str, Any]]:
        """Find teacher by ID, emp_code, email, or partial name."""
        if not identifier:
            # Fallback to Prof. R. V. Deshmukh (EMP-CSE-1009) or first teacher
            row = db.execute(text("SELECT t.*, d.name as department_name FROM teachers t LEFT JOIN departments d ON t.department_id = d.id WHERE t.emp_code = 'EMP-CSE-1009' OR t.id = '5bc85d0f-ea04-406e-a319-1e5c0f1c81b0' LIMIT 1")).fetchone()
            if not row:
                row = db.execute(text("SELECT t.*, d.name as department_name FROM teachers t LEFT JOIN departments d ON t.department_id = d.id LIMIT 1")).fetchone()
            return dict(row._mapping) if row else None

        clean_id = identifier.strip()
        # Direct ID or emp_code match
        row = db.execute(text("""
            SELECT t.*, d.name as department_name 
            FROM teachers t 
            LEFT JOIN departments d ON t.department_id = d.id 
            WHERE t.id = :uid 
               OR LOWER(t.emp_code) = LOWER(:uid) 
               OR LOWER(t.email) = LOWER(:uid)
               OR LOWER(t.full_name) = LOWER(:uid)
            LIMIT 1
        """), {"uid": clean_id}).fetchone()

        if not row:
            # Partial name match
            row = db.execute(text("""
                SELECT t.*, d.name as department_name 
                FROM teachers t 
                LEFT JOIN departments d ON t.department_id = d.id 
                WHERE LOWER(t.full_name) LIKE LOWER(:pat)
                LIMIT 1
            """), {"pat": f"%{clean_id}%"}).fetchone()

        if not row:
            # Fallback to default
            row = db.execute(text("SELECT t.*, d.name as department_name FROM teachers t LEFT JOIN departments d ON t.department_id = d.id WHERE t.emp_code = 'EMP-CSE-1009' LIMIT 1")).fetchone()
            if not row:
                row = db.execute(text("SELECT t.*, d.name as department_name FROM teachers t LEFT JOIN departments d ON t.department_id = d.id LIMIT 1")).fetchone()

        return dict(row._mapping) if row else None
=======
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
>>>>>>> fd7760bf814784b37a85b715e43aae31ce38985e

    @staticmethod
    def get_profile(db: Session, teacher_identifier: Optional[str] = None) -> Optional[Dict[str, Any]]:
        teacher = FacultyService.get_teacher_by_identifier(teacher_identifier, db)
        if not teacher:
            return None
        data = dict(teacher)
        data["fullName"] = data.get("full_name")
        data["empCode"] = data.get("emp_code")
        data["department"] = data.get("department_name") or data.get("department_id") or "CSE"
        return data

    @staticmethod
    def update_profile(updates: Dict[str, Any], db: Session, teacher_identifier: Optional[str] = None) -> Optional[Dict[str, Any]]:
        teacher = FacultyService.get_teacher_by_identifier(teacher_identifier, db)
        if not teacher:
            return None
        tid = teacher["id"]
        for k, v in updates.items():
            if v is not None and k not in ("id", "emp_code"):
                db.execute(text(f"UPDATE teachers SET {k} = :val WHERE id = :id"), {"val": v, "id": tid})
        db.commit()
        upd = db.execute(text("SELECT t.*, d.name as department_name FROM teachers t LEFT JOIN departments d ON t.department_id = d.id WHERE t.id = :id"), {"id": tid}).fetchone()
        return dict(upd._mapping) if upd else None

    @staticmethod
<<<<<<< HEAD
    def get_all_teachers(db: Session) -> List[Dict[str, Any]]:
        """List all 15 faculty members with department & load count."""
        rows = db.execute(text("""
            SELECT t.id, t.emp_code, t.full_name, t.designation, t.email,
                   COALESCE(d.name, 'Computer Science & Engineering') as department_name,
                   (SELECT count(*) FROM timetable_entries WHERE teacher_id = t.id) as total_load_hours
            FROM teachers t
            LEFT JOIN departments d ON t.department_id = d.id
            ORDER BY t.emp_code ASC
        """)).fetchall()
        return [dict(r._mapping) for r in rows]

    @staticmethod
    def get_personal_timetable(teacher_identifier: Optional[str], db: Session) -> Dict[str, Any]:
        """Fetch strict personal weekly timetable from PDF schedule for the specified teacher."""
        teacher = FacultyService.get_teacher_by_identifier(teacher_identifier, db)
        if not teacher:
            return {
                "teacher": None,
                "time_headers": TIME_SLOT_HEADERS,
                "grid": [],
                "entries": [],
                "total_load": 0
            }

        tid = teacher["id"]
        t_name = teacher["full_name"]
        emp_code = teacher["emp_code"]
        dept = teacher.get("department_name") or "Computer Science & Engineering"

        # Query all scheduled timetable entries for this teacher
        rows = db.execute(text("""
            SELECT id, day, slot_index, period_num, period_time, course_name, venue, class_code, is_lab, batch, status, att_label
            FROM timetable_entries
            WHERE teacher_id = :tid OR emp_code = :emp
            ORDER BY
              CASE LOWER(day)
                WHEN 'monday' THEN 1
                WHEN 'tuesday' THEN 2
                WHEN 'wednesday' THEN 3
                WHEN 'thursday' THEN 4
                WHEN 'friday' THEN 5
                WHEN 'saturday' THEN 6
                ELSE 7
              END,
              slot_index ASC
        """), {"tid": tid, "emp": emp_code}).fetchall()

        entries = [dict(r._mapping) for r in rows]

        # If local entries are empty, attempt reading from Cloud Supabase REST API
        if not entries:
            try:
                import httpx, os
                supa_url = os.getenv("SUPABASE_URL", "https://gftqvclenyplnuoocbwe.supabase.co")
                supa_key = os.getenv("SUPABASE_ANON_KEY", "")
                if supa_key:
                    with httpx.Client(timeout=3.0) as client:
                        resp = client.get(
                            f"{supa_url}/rest/v1/timetable_entries?or=(teacher_id.eq.{tid},emp_code.eq.{emp_code})&order=slot_index.asc",
                            headers={"apikey": supa_key, "Authorization": f"Bearer {supa_key}"}
                        )
                        if resp.status_code == 200:
                            entries = resp.json()
            except Exception:
                pass

        # Construct structured 6-slot weekly grid
        day_map = {d: {s: None for s in range(1, 7)} for d in DAYS_ORDER}
        for e in entries:
            d_name = str(e.get("day", "")).capitalize()
            s_idx = e.get("slot_index")
            if d_name in day_map and s_idx in day_map[d_name]:
                day_map[d_name][s_idx] = e

        grid = []
        for d in DAYS_ORDER:
            slot_strings = []
            slot_objects = []
            for s in range(1, 7):
                item = day_map[d][s]
                if item:
                    venue_str = f" ({item['venue']})" if item.get('venue') else ""
                    slot_strings.append(f"{item['course_name']}{venue_str}")
                    slot_objects.append({
                        "slot_index": s,
                        "time": TIME_SLOT_HEADERS[s],
                        "subject": item["course_name"],
                        "class_code": item.get("class_code", "2R1"),
                        "venue": item.get("venue", "Room 201"),
                        "is_lab": bool(item.get("is_lab", False)),
                        "batch": item.get("batch"),
                        "is_free": False
                    })
                else:
                    slot_strings.append("Free Slot")
                    slot_objects.append({
                        "slot_index": s,
                        "time": TIME_SLOT_HEADERS[s],
                        "subject": "Free Slot",
                        "class_code": None,
                        "venue": None,
                        "is_lab": False,
                        "batch": None,
                        "is_free": True
                    })
            grid.append({
                "day": d,
                "slots": slot_strings,
                "periods": slot_objects
            })

=======
    def get_summary(db: Session) -> Dict[str, Any]:
        classes_cnt = db.execute(text("SELECT count(*) FROM classes")).scalar() or 0
        students_cnt = db.execute(text("SELECT count(*) FROM students")).scalar() or 0
        quizzes_cnt = db.execute(text("SELECT count(*) FROM quizzes")).scalar() or 0
        sessions_cnt = db.execute(text("SELECT count(*) FROM attendance_sessions")).scalar() or 0
        avg_att = db.execute(text("SELECT AVG(attendance_rate) FROM attendance_sessions")).scalar()
        avg_att_pct = round(float(avg_att), 1) if avg_att is not None else 0.0
>>>>>>> fd7760bf814784b37a85b715e43aae31ce38985e
        return {
            "teacher": {
                "id": tid,
                "emp_code": emp_code,
                "name": t_name,
                "full_name": t_name,
                "designation": teacher.get("designation") or "Faculty",
                "department": dept,
                "department_code": "CSE",
                "total_load_hours": len(entries)
            },
            "institution": "Shri Sant Gajanan Maharaj College of Engineering, Shegaon",
            "department": dept,
            "session": "2026-2027 (Autumn)",
            "time_headers": TIME_SLOT_HEADERS,
            "breaks": [
                {"name": "Lunch Break", "time": "01:00 PM - 01:15 PM", "after_slot": 2},
                {"name": "Tea Recess", "time": "03:15 PM - 03:45 PM", "after_slot": 4}
            ],
            "total_load": len(entries),
            "entries": entries,
            "grid": grid
        }

    @staticmethod
    def get_summary(db: Session, teacher_identifier: Optional[str] = None) -> Dict[str, Any]:
        teacher = FacultyService.get_teacher_by_identifier(teacher_identifier, db)
        classes_cnt = db.execute(text("SELECT count(*) FROM classes")).scalar() or 3
        students_cnt = db.execute(text("SELECT count(*) FROM students")).scalar() or 195
        quizzes_cnt = db.execute(text("SELECT count(*) FROM quizzes")).scalar() or 6
        sessions_cnt = db.execute(text("SELECT count(*) FROM attendance_sessions")).scalar() or 42

        # Today's personal schedule
        today_name = datetime.now().strftime("%A")
        today_schedule = []
        if teacher:
            tid = teacher["id"]
            emp_code = teacher["emp_code"]
            t_rows = db.execute(text("""
                SELECT * FROM timetable_entries 
                WHERE (teacher_id = :tid OR emp_code = :emp) AND LOWER(day) = LOWER(:tday)
                ORDER BY slot_index ASC
            """), {"tid": tid, "emp": emp_code, "tday": today_name}).fetchall()

            for r in t_rows:
                m = dict(r._mapping)
                today_schedule.append({
                    "time": m.get("period_time", "11:00 AM - 12:00 PM"),
                    "subject": m.get("course_name", "Lecture"),
                    "class": m.get("class_code", "2R1"),
                    "room": m.get("venue", "Room 201"),
                    "type": "Practical" if m.get("is_lab") else "Lecture",
                    "status": "scheduled"
                })

        return {
            "faculty": {
                "id": teacher["id"] if teacher else "a0000000-0000-0000-0000-000000000001",
                "name": teacher["full_name"] if teacher else "Dr. Rohan Deshmukh",
                "employeeId": teacher["emp_code"] if teacher else "FAC-CSE-1048",
                "prefix": "Prof.",
                "title": teacher.get("designation") if teacher else "Associate Professor",
                "departmentCode": "CSE",
                "cabinLocation": "Academic Block B, Room 204"
            },
            "metrics": {
                "totalClasses": classes_cnt,
                "totalStudents": students_cnt,
                "averageAttendance": "87.4%",
                "syllabusCompleted": "68%",
                "unreadNotifications": 2,
                "totalLecturesDelivered": sessions_cnt
            },
            "todaySchedule": today_schedule,
            "total_classes": classes_cnt,
            "total_students": students_cnt,
            "total_quizzes": quizzes_cnt,
            "total_attendance_sessions": sessions_cnt,
<<<<<<< HEAD
            "attendance_average_pct": 87.4
=======
            "attendance_average_pct": avg_att_pct
>>>>>>> fd7760bf814784b37a85b715e43aae31ce38985e
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
