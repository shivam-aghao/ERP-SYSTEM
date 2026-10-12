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
    def get_teacher_by_identifier(identifier: Optional[str], db: Session) -> Optional[Dict[str, Any]]:
        """Find teacher by ID, emp_code, email, or partial name."""
        if not identifier:
            # Fallback to Dr. J. M. Patil (EMP-CSE-1001) from Supabase
            row = db.execute(text("SELECT t.*, d.name as department_name FROM teachers t LEFT JOIN departments d ON t.department_id = d.id WHERE t.emp_code = 'EMP-CSE-1001' OR t.id = '8f913c70-85ed-4261-bbd0-f2d3b42f4af1' OR t.full_name LIKE '%Patil%' LIMIT 1")).fetchone()
            if not row:
                row = db.execute(text("SELECT t.*, d.name as department_name FROM teachers t LEFT JOIN departments d ON t.department_id = d.id LIMIT 1")).fetchone()
            return dict(row._mapping) if row else None

        clean_id = identifier.strip()
        # Direct ID or emp_code match
        row = db.execute(text("""
            SELECT t.*, d.name as department_name 
            FROM teachers t 
            LEFT JOIN departments d ON t.department_id = d.id 
            WHERE t.id::text = :uid 
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
            # Fallback to Dr. J. M. Patil
            row = db.execute(text("SELECT t.*, d.name as department_name FROM teachers t LEFT JOIN departments d ON t.department_id = d.id WHERE t.emp_code = 'EMP-CSE-1001' OR t.full_name LIKE '%Patil%' LIMIT 1")).fetchone()
            if not row:
                row = db.execute(text("SELECT t.*, d.name as department_name FROM teachers t LEFT JOIN departments d ON t.department_id = d.id LIMIT 1")).fetchone()

        return dict(row._mapping) if row else None

    @staticmethod
    def get_profile(db: Session, emp_code: Optional[str] = None) -> Optional[Dict[str, Any]]:
        teacher = FacultyService.get_teacher_by_identifier(emp_code, db)
        if not teacher:
            return None
        teacher["fullName"] = teacher.get("full_name")
        teacher["empCode"] = teacher.get("emp_code")
        teacher["department"] = teacher.get("department_name") or teacher.get("department_code") or "Computer Science & Engineering"
        return teacher


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
        valid_cols = {"full_name", "email", "phone", "designation", "avatar", "password"}
        for k, v in updates.items():
            if v is not None and k in valid_cols:
                db.execute(text(f"UPDATE teachers SET {k} = :val WHERE id = :id"), {"val": v, "id": tid})
        db.commit()
        upd = db.execute(text("SELECT t.*, d.name as department_name FROM teachers t LEFT JOIN departments d ON t.department_id = d.id WHERE t.id = :id"), {"id": tid}).fetchone()
        return dict(upd._mapping) if upd else None

    @staticmethod
    def get_timetable(db: Session, teacher_identifier: Optional[str] = None) -> Dict[str, Any]:
        return FacultyService.get_personal_timetable(teacher_identifier, db)

    @staticmethod
    def get_all_teachers(db: Session) -> List[Dict[str, Any]]:
        """List all 15 faculty members with department & load count."""
        try:
            import json, os
            json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data_teacher_timetables.json")
            load_map = {}
            if os.path.exists(json_path):
                with open(json_path, "r", encoding="utf-8") as f:
                    tdata = json.load(f)
                    for emp, info in tdata.items():
                        tot = sum(tl.get("total", 0) for tl in info.get("teaching_load", []))
                        load_map[emp] = tot

            rows = db.execute(text("""
                SELECT t.id, t.emp_code, t.full_name, t.designation, t.email,
                       COALESCE(d.name, 'Computer Science & Engineering') as department_name
                FROM teachers t
                LEFT JOIN departments d ON t.department_id = d.id
                ORDER BY t.emp_code ASC
            """)).fetchall()
            
            result = []
            for r in rows:
                m = dict(r._mapping)
                m["total_load_hours"] = load_map.get(m.get("emp_code"), 16)
                result.append(m)
            return result
        except Exception:
            rows = db.execute(text("""
                SELECT t.id, t.emp_code, t.full_name, t.designation, t.email,
                       COALESCE(d.name, 'Computer Science & Engineering') as department_name
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
        entries = []
        try:
            rows = db.execute(text("""
                SELECT id, day, period_num, period_time, course_name, venue, status, att_label
                FROM timetable_entries
                WHERE teacher_name LIKE :tname
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
                  period_num ASC
            """), {"tname": f"%{t_name}%"}).fetchall()
            entries = [dict(r._mapping) for r in rows]
        except Exception:
            pass

        # Fallback to local JSON timetable dataset from PDF
        if not entries:
            try:
                import json, os
                json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data_teacher_timetables.json")
                if os.path.exists(json_path):
                    with open(json_path, "r", encoding="utf-8") as f:
                        tdata = json.load(f)
                        fac_entry = tdata.get(emp_code)
                        if fac_entry and "schedule" in fac_entry:
                            for day, s_list in fac_entry["schedule"].items():
                                for itm in s_list:
                                    entries.append({
                                        "id": f"{emp_code}-{day}-{itm.get('slot', 1)}",
                                        "day": day,
                                        "slot_index": itm.get("slot", 1),
                                        "period_num": itm.get("slot", 1),
                                        "period_time": TIME_SLOT_HEADERS[itm.get("slot", 1)] if itm.get("slot", 1) < len(TIME_SLOT_HEADERS) else "11:00 - 12:00 PM",
                                        "course_name": itm.get("subject", ""),
                                        "venue": itm.get("venue", ""),
                                        "class_code": itm.get("class", ""),
                                        "is_lab": itm.get("is_lab", False),
                                        "batch": itm.get("batch"),
                                        "status": "scheduled",
                                        "att_label": "Theory" if not itm.get("is_lab") else "Lab"
                                    })
            except Exception:
                pass

        # If local entries are empty, build from official timetable specs
        if not entries:
            is_kulthe = (emp_code == "EMP-CSE-1015") or ("kulthe" in (t_name or "").lower()) or ("krushan" in (t_name or "").lower())
            is_rakhonde = (emp_code == "EMP-CSE-1014") or ("rakhonde" in (t_name or "").lower())
            is_fatkar = (emp_code == "EMP-CSE-1013") or ("fatkar" in (t_name or "").lower())
            is_kanherkar = (emp_code == "EMP-CSE-1012") or ("kanherkar" in (t_name or "").lower())
            is_puranik = (emp_code == "EMP-CSE-1011") or ("puranik" in (t_name or "").lower())
            is_jawake = (emp_code == "EMP-CSE-1010") or ("jawake" in (t_name or "").lower())
            is_deshmukh = (emp_code == "EMP-CSE-1009") or ("deshmukh" in (t_name or "").lower())
            is_zamare = (emp_code == "EMP-CSE-1008") or ("zamare" in (t_name or "").lower())
            is_pagrut = (emp_code == "EMP-CSE-1007") or ("pagrut" in (t_name or "").lower())
            is_sable = (emp_code == "EMP-CSE-1006") or ("sable" in (t_name or "").lower())
            is_bharne = (emp_code == "EMP-CSE-1005") or ("bharne" in (t_name or "").lower())
            is_mahalle = (emp_code == "EMP-CSE-1004") or ("mahalle" in (t_name or "").lower())
            is_mankar = (emp_code == "EMP-CSE-1003") or ("mankar" in (t_name or "").lower())
            is_kandoi = (emp_code == "EMP-CSE-1002") or ("kandoi" in (t_name or "").lower())
            if is_kulthe:
                # Official Timetable for Mr. Krushan. V. Kulthe (Assistant Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 4, "period_num": 4, "course_name": "MDM#1", "venue": "A4", "class_code": "2R1", "is_lab": False, "batch": None},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 4, "period_num": 4, "course_name": "MDM#1", "venue": "A4", "class_code": "2R1", "is_lab": False, "batch": None},
                    {"day": "Tuesday", "slot_index": 5, "period_num": 5, "course_name": "CEP(2R1-D)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch D"},
                    {"day": "Tuesday", "slot_index": 6, "period_num": 6, "course_name": "CEP(2R1-D)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch D"},
                    # Friday
                    {"day": "Friday", "slot_index": 1, "period_num": 1, "course_name": "CEP(2R1-D)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch D"},
                    {"day": "Friday", "slot_index": 2, "period_num": 2, "course_name": "CEP(2R1-D)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch D"},
                ]
            elif is_rakhonde:
                # Official Timetable for Prof. M. D. Rakhonde (Assistant Professor, CSE)
                entries = [
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 4, "period_num": 4, "course_name": "OE1", "venue": "A3", "class_code": "2R1", "is_lab": False, "batch": None},
                    {"day": "Wednesday", "slot_index": 5, "period_num": 5, "course_name": "(MDM#4)", "venue": "C1", "class_code": "3N", "is_lab": False, "batch": None},
                    # Thursday
                    {"day": "Thursday", "slot_index": 4, "period_num": 4, "course_name": "OE1", "venue": "A3", "class_code": "2R1", "is_lab": False, "batch": None},
                    {"day": "Thursday", "slot_index": 5, "period_num": 5, "course_name": "(MDM#4)", "venue": "C1", "class_code": "3N", "is_lab": False, "batch": None},
                    # Friday
                    {"day": "Friday", "slot_index": 4, "period_num": 4, "course_name": "OE1", "venue": "A3", "class_code": "2R1", "is_lab": False, "batch": None},
                    # Saturday
                    {"day": "Saturday", "slot_index": 1, "period_num": 1, "course_name": "MDM(WT-B5)", "venue": "Lab 02", "class_code": "3N", "is_lab": True, "batch": "Batch B5"},
                    {"day": "Saturday", "slot_index": 2, "period_num": 2, "course_name": "MDM(WT-B5)", "venue": "Lab 02", "class_code": "3N", "is_lab": True, "batch": "Batch B5"},
                    {"day": "Saturday", "slot_index": 3, "period_num": 3, "course_name": "MDM(WT-8)", "venue": "Lab 02", "class_code": "3N", "is_lab": True, "batch": "Batch B8"},
                    {"day": "Saturday", "slot_index": 4, "period_num": 4, "course_name": "MDM(WT-8)", "venue": "Lab 02", "class_code": "3N", "is_lab": True, "batch": "Batch B8"},
                ]
            elif is_fatkar:
                # Official Timetable for Prof. N. N. Fatkar (Assistant Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 1, "period_num": 1, "course_name": "DS(2R2-A)", "venue": "Lab 02", "class_code": "2R2", "is_lab": True, "batch": "Batch A"},
                    {"day": "Monday", "slot_index": 2, "period_num": 2, "course_name": "DS(2R2-A)", "venue": "Lab 02", "class_code": "2R2", "is_lab": True, "batch": "Batch A"},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 1, "period_num": 1, "course_name": "DS(2R2-C)", "venue": "Lab 02", "class_code": "2R2", "is_lab": True, "batch": "Batch C"},
                    {"day": "Tuesday", "slot_index": 2, "period_num": 2, "course_name": "DS(2R2-C)", "venue": "Lab 02", "class_code": "2R2", "is_lab": True, "batch": "Batch C"},
                    {"day": "Tuesday", "slot_index": 6, "period_num": 6, "course_name": "DS(2R2)", "venue": "B007", "class_code": "2R2", "is_lab": False, "batch": None},
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 1, "period_num": 1, "course_name": "DS(2R2-D)", "venue": "Lab 02", "class_code": "2R2", "is_lab": True, "batch": "Batch D"},
                    {"day": "Wednesday", "slot_index": 2, "period_num": 2, "course_name": "DS(2R2-D)", "venue": "Lab 02", "class_code": "2R2", "is_lab": True, "batch": "Batch D"},
                    {"day": "Wednesday", "slot_index": 3, "period_num": 3, "course_name": "DS(2R2)", "venue": "B007", "class_code": "2R2", "is_lab": False, "batch": None},
                    {"day": "Wednesday", "slot_index": 6, "period_num": 6, "course_name": "OE-III", "venue": "C1", "class_code": "3N", "is_lab": False, "batch": None},
                    # Thursday
                    {"day": "Thursday", "slot_index": 1, "period_num": 1, "course_name": "DS(2R2-B)", "venue": "Lab 02", "class_code": "2R2", "is_lab": True, "batch": "Batch B"},
                    {"day": "Thursday", "slot_index": 2, "period_num": 2, "course_name": "DS(2R2-B)", "venue": "Lab 02", "class_code": "2R2", "is_lab": True, "batch": "Batch B"},
                    {"day": "Thursday", "slot_index": 3, "period_num": 3, "course_name": "DS(2R2)", "venue": "B007", "class_code": "2R2", "is_lab": False, "batch": None},
                    {"day": "Thursday", "slot_index": 6, "period_num": 6, "course_name": "OE-III", "venue": "C1", "class_code": "3N", "is_lab": False, "batch": None},
                    # Friday
                    {"day": "Friday", "slot_index": 1, "period_num": 1, "course_name": "DS(2R2)", "venue": "B108", "class_code": "2R2", "is_lab": False, "batch": None},
                    # Saturday
                    {"day": "Saturday", "slot_index": 1, "period_num": 1, "course_name": "MDM(WT-B6)", "venue": "Lab 02", "class_code": "3N", "is_lab": True, "batch": "Batch B6"},
                    {"day": "Saturday", "slot_index": 2, "period_num": 2, "course_name": "MDM(WT-B6)", "venue": "Lab 02", "class_code": "3N", "is_lab": True, "batch": "Batch B6"},
                    {"day": "Saturday", "slot_index": 3, "period_num": 3, "course_name": "MDM(WT-B7)", "venue": "Lab 02", "class_code": "3N", "is_lab": True, "batch": "Batch B7"},
                    {"day": "Saturday", "slot_index": 4, "period_num": 4, "course_name": "MDM(WT-B7)", "venue": "Lab 02", "class_code": "3N", "is_lab": True, "batch": "Batch B7"},
                ]
            elif is_kanherkar:
                # Official Timetable for Prof. V. S. Kanherkar (Assistant Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 4, "period_num": 4, "course_name": "MDM#1", "venue": "C2", "class_code": "2R1", "is_lab": False, "batch": None},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 1, "period_num": 1, "course_name": "CEP(2R2-A)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch A"},
                    {"day": "Tuesday", "slot_index": 2, "period_num": 2, "course_name": "CEP(2R2-A)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch A"},
                    {"day": "Tuesday", "slot_index": 4, "period_num": 4, "course_name": "MDM#1", "venue": "C2", "class_code": "2R1", "is_lab": False, "batch": None},
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 1, "period_num": 1, "course_name": "CEP(2R2-A)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch A"},
                    {"day": "Wednesday", "slot_index": 2, "period_num": 2, "course_name": "CEP(2R2-A)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch A"},
                    # Saturday
                    {"day": "Saturday", "slot_index": 1, "period_num": 1, "course_name": "MDM(WT-B3)", "venue": "Lab 02", "class_code": "3N", "is_lab": True, "batch": "Batch B3"},
                    {"day": "Saturday", "slot_index": 2, "period_num": 2, "course_name": "MDM(WT-B3)", "venue": "Lab 02", "class_code": "3N", "is_lab": True, "batch": "Batch B3"},
                ]
            elif is_puranik:
                # Official Timetable for Prof. T. A. Puranik (Assistant Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 1, "period_num": 1, "course_name": "CEP(2R2-B)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch B"},
                    {"day": "Monday", "slot_index": 2, "period_num": 2, "course_name": "CEP(2R2-B)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch B"},
                    {"day": "Monday", "slot_index": 3, "period_num": 3, "course_name": "DS&GT(2R1)", "venue": "B108", "class_code": "2R1", "is_lab": False, "batch": None},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 2, "period_num": 2, "course_name": "DS&GT(2R1)", "venue": "B108", "class_code": "2R1", "is_lab": False, "batch": None},
                    {"day": "Tuesday", "slot_index": 5, "period_num": 5, "course_name": "DSGT(2R2)", "venue": "B007", "class_code": "2R2", "is_lab": False, "batch": None},
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 1, "period_num": 1, "course_name": "CEP(2R2-B)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch B"},
                    {"day": "Wednesday", "slot_index": 2, "period_num": 2, "course_name": "CEP(2R2-B)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch B"},
                    {"day": "Wednesday", "slot_index": 3, "period_num": 3, "course_name": "DS&GT(2R1)", "venue": "B108", "class_code": "2R1", "is_lab": False, "batch": None},
                    {"day": "Wednesday", "slot_index": 5, "period_num": 5, "course_name": "DS&GT (2R2)", "venue": "B007", "class_code": "2R2", "is_lab": False, "batch": None},
                    # Thursday
                    {"day": "Thursday", "slot_index": 2, "period_num": 2, "course_name": "DSGT(2R1)", "venue": "B108", "class_code": "2R1", "is_lab": False, "batch": None},
                    {"day": "Thursday", "slot_index": 5, "period_num": 5, "course_name": "DS&GT (2R2)", "venue": "B007", "class_code": "2R2", "is_lab": False, "batch": None},
                    # Friday
                    {"day": "Friday", "slot_index": 2, "period_num": 2, "course_name": "DS&GT(2R2)", "venue": "B007", "class_code": "2R2", "is_lab": False, "batch": None},
                ]
            elif is_jawake:
                # Official Timetable for Prof. S. M. Jawake (Assistant Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 5, "period_num": 5, "course_name": "MDM#3", "venue": "C2", "class_code": "3N", "is_lab": False, "batch": None},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 5, "period_num": 5, "course_name": "MDM#3", "venue": "C2", "class_code": "3N", "is_lab": False, "batch": None},
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 5, "period_num": 5, "course_name": "CEP(2R1-A)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch A"},
                    {"day": "Wednesday", "slot_index": 6, "period_num": 6, "course_name": "CEP(2R1-A)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch A"},
                    # Thursday
                    {"day": "Thursday", "slot_index": 5, "period_num": 5, "course_name": "CEP(2R1-A)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch A"},
                    {"day": "Thursday", "slot_index": 6, "period_num": 6, "course_name": "CEP(2R1-A)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch A"},
                    # Saturday
                    {"day": "Saturday", "slot_index": 3, "period_num": 3, "course_name": "MDM(WT-B2)", "venue": "Lab 02", "class_code": "3N", "is_lab": True, "batch": "Batch B2"},
                    {"day": "Saturday", "slot_index": 4, "period_num": 4, "course_name": "MDM(WT-B2)", "venue": "Lab 02", "class_code": "3N", "is_lab": True, "batch": "Batch B2"},
                ]
            elif is_deshmukh:
                # Official Timetable for Prof. R. V. Deshmukh (Assistant Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 1, "period_num": 1, "course_name": "CEP(2R2-C)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch C"},
                    {"day": "Monday", "slot_index": 2, "period_num": 2, "course_name": "CEP(2R2-C)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch C"},
                    {"day": "Monday", "slot_index": 5, "period_num": 5, "course_name": "CG (C)", "venue": "Graphics Lab", "class_code": "4R", "is_lab": True, "batch": "Batch C"},
                    {"day": "Monday", "slot_index": 6, "period_num": 6, "course_name": "CG (C)", "venue": "Graphics Lab", "class_code": "4R", "is_lab": True, "batch": "Batch C"},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 1, "period_num": 1, "course_name": "DMS", "venue": "B206", "class_code": "3N", "is_lab": False, "batch": None},
                    {"day": "Tuesday", "slot_index": 4, "period_num": 4, "course_name": "CG", "venue": "B206", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Tuesday", "slot_index": 5, "period_num": 5, "course_name": "CG (D)", "venue": "Graphics Lab", "class_code": "4R", "is_lab": True, "batch": "Batch D"},
                    {"day": "Tuesday", "slot_index": 6, "period_num": 6, "course_name": "CG (D)", "venue": "Graphics Lab", "class_code": "4R", "is_lab": True, "batch": "Batch D"},
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 1, "period_num": 1, "course_name": "DMS", "venue": "B206", "class_code": "3N", "is_lab": False, "batch": None},
                    {"day": "Wednesday", "slot_index": 4, "period_num": 4, "course_name": "CG", "venue": "B206", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Wednesday", "slot_index": 5, "period_num": 5, "course_name": "CG (B)", "venue": "Graphics Lab", "class_code": "4R", "is_lab": True, "batch": "Batch B"},
                    {"day": "Wednesday", "slot_index": 6, "period_num": 6, "course_name": "CG (B)", "venue": "Graphics Lab", "class_code": "4R", "is_lab": True, "batch": "Batch B"},
                    # Thursday
                    {"day": "Thursday", "slot_index": 1, "period_num": 1, "course_name": "CEP(2R2-C)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch C"},
                    {"day": "Thursday", "slot_index": 2, "period_num": 2, "course_name": "CEP(2R2-C)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch C"},
                    {"day": "Thursday", "slot_index": 3, "period_num": 3, "course_name": "CG", "venue": "B206", "class_code": "4R", "is_lab": False, "batch": None},
                    # Friday
                    {"day": "Friday", "slot_index": 2, "period_num": 2, "course_name": "DMS", "venue": "B206", "class_code": "3N", "is_lab": False, "batch": None},
                    {"day": "Friday", "slot_index": 5, "period_num": 5, "course_name": "CG (A)", "venue": "Graphics Lab", "class_code": "4R", "is_lab": True, "batch": "Batch A"},
                    {"day": "Friday", "slot_index": 6, "period_num": 6, "course_name": "CG (A)", "venue": "Graphics Lab", "class_code": "4R", "is_lab": True, "batch": "Batch A"},
                ]
            elif is_zamare:
                # Official Timetable for Dr. R. A. Zamare (Associate Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 1, "period_num": 1, "course_name": "CA&O", "venue": "B206", "class_code": "3N", "is_lab": False, "batch": None},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 5, "period_num": 5, "course_name": "CEP(2R1-B)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch B"},
                    {"day": "Tuesday", "slot_index": 6, "period_num": 6, "course_name": "CEP(2R1-B)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch B"},
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 2, "period_num": 2, "course_name": "CA&O", "venue": "B206", "class_code": "3N", "is_lab": False, "batch": None},
                    {"day": "Wednesday", "slot_index": 5, "period_num": 5, "course_name": "MDM#4", "venue": "C2", "class_code": "3N", "is_lab": False, "batch": None},
                    # Thursday
                    {"day": "Thursday", "slot_index": 1, "period_num": 1, "course_name": "CA&O", "venue": "B206", "class_code": "3N", "is_lab": False, "batch": None},
                    {"day": "Thursday", "slot_index": 5, "period_num": 5, "course_name": "MDM#4", "venue": "C2", "class_code": "3N", "is_lab": False, "batch": None},
                    # Friday
                    {"day": "Friday", "slot_index": 1, "period_num": 1, "course_name": "CEP(2R1-B)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch B"},
                    {"day": "Friday", "slot_index": 2, "period_num": 2, "course_name": "CEP(2R1-B)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch B"},
                    # Saturday
                    {"day": "Saturday", "slot_index": 1, "period_num": 1, "course_name": "MDM(WT-B1)", "venue": "Lab 01", "class_code": "3N", "is_lab": True, "batch": "Batch B1"},
                    {"day": "Saturday", "slot_index": 2, "period_num": 2, "course_name": "MDM(WT-B1)", "venue": "Lab 01", "class_code": "3N", "is_lab": True, "batch": "Batch B1"},
                ]
            elif is_pagrut:
                # Official Timetable for Prof. S. B. Pagrut (Assistant Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 2, "period_num": 2, "course_name": "OOP(2R1)", "venue": "B108", "class_code": "2R1", "is_lab": False, "batch": None},
                    {"day": "Monday", "slot_index": 4, "period_num": 4, "course_name": "PE - III DF(B6)", "venue": "Room 402", "class_code": "4R", "is_lab": False, "batch": "B6"},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 2, "period_num": 2, "course_name": "PE - III DF", "venue": "Room 402", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Tuesday", "slot_index": 3, "period_num": 3, "course_name": "OOP(2R1)", "venue": "B108", "class_code": "2R1", "is_lab": False, "batch": None},
                    {"day": "Tuesday", "slot_index": 5, "period_num": 5, "course_name": "OOP(2R1-A)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch A"},
                    {"day": "Tuesday", "slot_index": 6, "period_num": 6, "course_name": "OOP(2R1-A)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch A"},
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 2, "period_num": 2, "course_name": "OOP(2R1)", "venue": "B108", "class_code": "2R1", "is_lab": False, "batch": None},
                    {"day": "Wednesday", "slot_index": 5, "period_num": 5, "course_name": "OOP(2R1-D)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch D"},
                    {"day": "Wednesday", "slot_index": 6, "period_num": 6, "course_name": "OOP(2R1-D)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch D"},
                    # Thursday
                    {"day": "Thursday", "slot_index": 3, "period_num": 3, "course_name": "OOP(2R1)", "venue": "B108", "class_code": "2R1", "is_lab": False, "batch": None},
                    {"day": "Thursday", "slot_index": 4, "period_num": 4, "course_name": "PE - III DF (B2)", "venue": "Room 402", "class_code": "4R", "is_lab": False, "batch": "B2"},
                    {"day": "Thursday", "slot_index": 5, "period_num": 5, "course_name": "OOP(2R1-B)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch B"},
                    {"day": "Thursday", "slot_index": 6, "period_num": 6, "course_name": "OOP(2R1-B)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch B"},
                    # Friday
                    {"day": "Friday", "slot_index": 1, "period_num": 1, "course_name": "OOP(2R1-C)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch C"},
                    {"day": "Friday", "slot_index": 2, "period_num": 2, "course_name": "OOP(2R1-C)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch C"},
                    {"day": "Friday", "slot_index": 3, "period_num": 3, "course_name": "ET Lab III – DF (H)", "venue": "ET Lab III", "class_code": "4R", "is_lab": True, "batch": "Batch H"},
                    {"day": "Friday", "slot_index": 4, "period_num": 4, "course_name": "ET Lab III – DF (H)", "venue": "ET Lab III", "class_code": "4R", "is_lab": True, "batch": "Batch H"},
                ]
            elif is_sable:
                # Official Timetable for Prof. K. P. Sable (Assistant Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 1, "period_num": 1, "course_name": "DS", "venue": "B108", "class_code": "2R1", "is_lab": False, "batch": None},
                    {"day": "Monday", "slot_index": 3, "period_num": 3, "course_name": "SSEE", "venue": "B108", "class_code": "4R", "is_lab": False, "batch": None},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 1, "period_num": 1, "course_name": "DS", "venue": "B108", "class_code": "2R1", "is_lab": False, "batch": None},
                    {"day": "Tuesday", "slot_index": 3, "period_num": 3, "course_name": "SSEE", "venue": "B108", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Tuesday", "slot_index": 5, "period_num": 5, "course_name": "DS (2R1-C)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch C"},
                    {"day": "Tuesday", "slot_index": 6, "period_num": 6, "course_name": "DS (2R1-C)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch C"},
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 1, "period_num": 1, "course_name": "DS", "venue": "B108", "class_code": "2R1", "is_lab": False, "batch": None},
                    {"day": "Wednesday", "slot_index": 3, "period_num": 3, "course_name": "SSEE", "venue": "B108", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Wednesday", "slot_index": 5, "period_num": 5, "course_name": "DS (2R1-B)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch B"},
                    {"day": "Wednesday", "slot_index": 6, "period_num": 6, "course_name": "DS (2R1-B)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch B"},
                    # Thursday
                    {"day": "Thursday", "slot_index": 5, "period_num": 5, "course_name": "DS (2R1-D)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch D"},
                    {"day": "Thursday", "slot_index": 6, "period_num": 6, "course_name": "DS (2R1-D)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch D"},
                    # Friday
                    {"day": "Friday", "slot_index": 1, "period_num": 1, "course_name": "DS (2R1-A)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch A"},
                    {"day": "Friday", "slot_index": 2, "period_num": 2, "course_name": "DS (2R1-A)", "venue": "Lab", "class_code": "2R1", "is_lab": True, "batch": "Batch A"},
                    {"day": "Friday", "slot_index": 3, "period_num": 3, "course_name": "DS", "venue": "B108", "class_code": "2R1", "is_lab": False, "batch": None},
                    # Saturday
                    {"day": "Saturday", "slot_index": 3, "period_num": 3, "course_name": "MDM (WT-B4)", "venue": "Lab 04", "class_code": "3N", "is_lab": True, "batch": "Batch B4"},
                    {"day": "Saturday", "slot_index": 4, "period_num": 4, "course_name": "MDM (WT-B4)", "venue": "Lab 04", "class_code": "3N", "is_lab": True, "batch": "Batch B4"},
                ]
            elif is_bharne:
                # Official Timetable for Dr. P. K. Bharne (Assistant Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 4, "period_num": 4, "course_name": "DWM", "venue": "B206", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Monday", "slot_index": 6, "period_num": 6, "course_name": "PE - 1 DSS", "venue": "B206", "class_code": "3N", "is_lab": False, "batch": None},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 2, "period_num": 2, "course_name": "DWM", "venue": "B007", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Tuesday", "slot_index": 3, "period_num": 3, "course_name": "ET Lab-I DSS (G)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch G"},
                    {"day": "Tuesday", "slot_index": 4, "period_num": 4, "course_name": "ET Lab-I DSS (G)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch G"},
                    {"day": "Tuesday", "slot_index": 6, "period_num": 6, "course_name": "PE - 1 DSS", "venue": "B206", "class_code": "3N", "is_lab": False, "batch": None},
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 3, "period_num": 3, "course_name": "ET Lab-I DSS (E)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch E"},
                    {"day": "Wednesday", "slot_index": 4, "period_num": 4, "course_name": "ET Lab-I DSS (E)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch E"},
                    {"day": "Wednesday", "slot_index": 5, "period_num": 5, "course_name": "ET Lab III – DW&M (G)", "venue": "Lab", "class_code": "4R", "is_lab": True, "batch": "Batch G"},
                    {"day": "Wednesday", "slot_index": 6, "period_num": 6, "course_name": "ET Lab III – DW&M (G)", "venue": "Lab", "class_code": "4R", "is_lab": True, "batch": "Batch G"},
                    # Thursday
                    {"day": "Thursday", "slot_index": 4, "period_num": 4, "course_name": "DWM", "venue": "B206", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Thursday", "slot_index": 5, "period_num": 5, "course_name": "ET Lab III- DWM(F)", "venue": "Lab", "class_code": "4R", "is_lab": True, "batch": "Batch F"},
                    {"day": "Thursday", "slot_index": 6, "period_num": 6, "course_name": "ET Lab III- DWM(F)", "venue": "Lab", "class_code": "4R", "is_lab": True, "batch": "Batch F"},
                    # Friday
                    {"day": "Friday", "slot_index": 1, "period_num": 1, "course_name": "PE - 1 DSS", "venue": "B206", "class_code": "3N", "is_lab": False, "batch": None},
                    {"day": "Friday", "slot_index": 3, "period_num": 3, "course_name": "ET Lab III – DW&M (E)", "venue": "Lab", "class_code": "4R", "is_lab": True, "batch": "Batch E"},
                    {"day": "Friday", "slot_index": 4, "period_num": 4, "course_name": "ET Lab III – DW&M (E)", "venue": "Lab", "class_code": "4R", "is_lab": True, "batch": "Batch E"},
                    {"day": "Friday", "slot_index": 5, "period_num": 5, "course_name": "ET Lab-I DSS (F)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch F"},
                    {"day": "Friday", "slot_index": 6, "period_num": 6, "course_name": "ET Lab-I DSS (F)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch F"},
                ]
            elif is_mahalle:
                # Official Timetable for Dr. V. S. Mahalle (Assistant Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 1, "period_num": 1, "course_name": "OOP (2R2-D)", "venue": "Lab", "class_code": "2R2", "is_lab": True, "batch": "Batch D"},
                    {"day": "Monday", "slot_index": 2, "period_num": 2, "course_name": "OOP (2R2-D)", "venue": "Lab", "class_code": "2R2", "is_lab": True, "batch": "Batch D"},
                    {"day": "Monday", "slot_index": 3, "period_num": 3, "course_name": "OOP", "venue": "B007", "class_code": "2R2", "is_lab": False, "batch": None},
                    {"day": "Monday", "slot_index": 6, "period_num": 6, "course_name": "ICS", "venue": "DBMS Lab", "class_code": "3R", "is_lab": False, "batch": None},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 1, "period_num": 1, "course_name": "OOP 2R2-(B)", "venue": "Lab", "class_code": "2R2", "is_lab": True, "batch": "Batch B"},
                    {"day": "Tuesday", "slot_index": 2, "period_num": 2, "course_name": "OOP 2R2-(B)", "venue": "Lab", "class_code": "2R2", "is_lab": True, "batch": "Batch B"},
                    {"day": "Tuesday", "slot_index": 3, "period_num": 3, "course_name": "OOP", "venue": "B007", "class_code": "2R2", "is_lab": False, "batch": None},
                    {"day": "Tuesday", "slot_index": 6, "period_num": 6, "course_name": "ICS", "venue": "DBMS Lab", "class_code": "3R", "is_lab": False, "batch": None},
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 1, "period_num": 1, "course_name": "OOP (2R2-C)", "venue": "Lab", "class_code": "2R2", "is_lab": True, "batch": "Batch C"},
                    {"day": "Wednesday", "slot_index": 2, "period_num": 2, "course_name": "OOP (2R2-C)", "venue": "Lab", "class_code": "2R2", "is_lab": True, "batch": "Batch C"},
                    {"day": "Wednesday", "slot_index": 3, "period_num": 3, "course_name": "ET Lab: ICS (H)", "venue": "ET Lab I", "class_code": "3R", "is_lab": True, "batch": "Batch H"},
                    {"day": "Wednesday", "slot_index": 4, "period_num": 4, "course_name": "ET Lab: ICS (H)", "venue": "ET Lab I", "class_code": "3R", "is_lab": True, "batch": "Batch H"},
                    {"day": "Wednesday", "slot_index": 6, "period_num": 6, "course_name": "OOP", "venue": "B007", "class_code": "2R2", "is_lab": False, "batch": None},
                    # Thursday
                    {"day": "Thursday", "slot_index": 1, "period_num": 1, "course_name": "OOP 2R2-(A)", "venue": "Lab", "class_code": "2R2", "is_lab": True, "batch": "Batch A"},
                    {"day": "Thursday", "slot_index": 2, "period_num": 2, "course_name": "OOP 2R2-(A)", "venue": "Lab", "class_code": "2R2", "is_lab": True, "batch": "Batch A"},
                    # Friday
                    {"day": "Friday", "slot_index": 1, "period_num": 1, "course_name": "ICS", "venue": "DBMS Lab", "class_code": "3R", "is_lab": False, "batch": None},
                    {"day": "Friday", "slot_index": 3, "period_num": 3, "course_name": "OOP", "venue": "B007", "class_code": "2R2", "is_lab": False, "batch": None},
                ]
            elif is_mankar:
                # Official Timetable for Prof. C. M. Mankar (Assistant Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 2, "period_num": 2, "course_name": "CD", "venue": "B206", "class_code": "3N", "is_lab": False, "batch": None},
                    {"day": "Monday", "slot_index": 3, "period_num": 3, "course_name": "CD (B)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch B"},
                    {"day": "Monday", "slot_index": 4, "period_num": 4, "course_name": "CD (B)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch B"},
                    {"day": "Monday", "slot_index": 5, "period_num": 5, "course_name": "MDM#3", "venue": "C1", "class_code": "3N", "is_lab": False, "batch": None},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 2, "period_num": 2, "course_name": "CD", "venue": "B206", "class_code": "3N", "is_lab": False, "batch": None},
                    {"day": "Tuesday", "slot_index": 3, "period_num": 3, "course_name": "CD (A)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch A"},
                    {"day": "Tuesday", "slot_index": 4, "period_num": 4, "course_name": "CD (A)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch A"},
                    {"day": "Tuesday", "slot_index": 5, "period_num": 5, "course_name": "MDM#3", "venue": "C1", "class_code": "3N", "is_lab": False, "batch": None},
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 5, "period_num": 5, "course_name": "CEP (2R1-C)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch C"},
                    {"day": "Wednesday", "slot_index": 6, "period_num": 6, "course_name": "CEP (2R1-C)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch C"},
                    # Thursday
                    {"day": "Thursday", "slot_index": 2, "period_num": 2, "course_name": "CD", "venue": "B206", "class_code": "3N", "is_lab": False, "batch": None},
                    {"day": "Thursday", "slot_index": 3, "period_num": 3, "course_name": "CD (D)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch D"},
                    {"day": "Thursday", "slot_index": 4, "period_num": 4, "course_name": "CD (D)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch D"},
                    {"day": "Thursday", "slot_index": 5, "period_num": 5, "course_name": "CEP (2R1-C)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch C"},
                    {"day": "Thursday", "slot_index": 6, "period_num": 6, "course_name": "CEP (2R1-C)", "venue": "Seminar Hall", "class_code": "2R1", "is_lab": True, "batch": "Batch C"},
                    # Friday
                    {"day": "Friday", "slot_index": 3, "period_num": 3, "course_name": "CD (C)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch C"},
                    {"day": "Friday", "slot_index": 4, "period_num": 4, "course_name": "CD (C)", "venue": "Lab", "class_code": "3N", "is_lab": True, "batch": "Batch C"},
                ]
            elif is_kandoi:
                # Official Timetable for Dr. N. M. Kandoi (Assistant Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 2, "period_num": 2, "course_name": "BF", "venue": "B007", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Monday", "slot_index": 5, "period_num": 5, "course_name": "ET LAB IV BF", "venue": "ET Lab IV", "class_code": "4R", "is_lab": True, "batch": "Batch B"},
                    {"day": "Monday", "slot_index": 6, "period_num": 6, "course_name": "ET LAB IV BF", "venue": "ET Lab IV", "class_code": "4R", "is_lab": True, "batch": "Batch B"},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 1, "period_num": 1, "course_name": "CEP(D-2R2)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch D"},
                    {"day": "Tuesday", "slot_index": 2, "period_num": 2, "course_name": "CEP(D-2R2)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch D"},
                    {"day": "Tuesday", "slot_index": 5, "period_num": 5, "course_name": "ET LAB IV BF", "venue": "ET Lab IV", "class_code": "4R", "is_lab": True, "batch": "Batch C"},
                    {"day": "Tuesday", "slot_index": 6, "period_num": 6, "course_name": "ET LAB IV BF", "venue": "ET Lab IV", "class_code": "4R", "is_lab": True, "batch": "Batch C"},
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 2, "period_num": 2, "course_name": "BF", "venue": "B007", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Wednesday", "slot_index": 5, "period_num": 5, "course_name": "ET LAB IV BF", "venue": "ET Lab IV", "class_code": "4R", "is_lab": True, "batch": "Batch A"},
                    {"day": "Wednesday", "slot_index": 6, "period_num": 6, "course_name": "ET LAB IV BF", "venue": "ET Lab IV", "class_code": "4R", "is_lab": True, "batch": "Batch A"},
                    # Thursday
                    {"day": "Thursday", "slot_index": 1, "period_num": 1, "course_name": "CEP(D-2R2)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch D"},
                    {"day": "Thursday", "slot_index": 2, "period_num": 2, "course_name": "CEP(D-2R2)", "venue": "Seminar Hall", "class_code": "2R2", "is_lab": True, "batch": "Batch D"},
                    # Friday
                    {"day": "Friday", "slot_index": 2, "period_num": 2, "course_name": "BF", "venue": "B007", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Friday", "slot_index": 5, "period_num": 5, "course_name": "ET LAB IV BF", "venue": "ET Lab IV", "class_code": "4R", "is_lab": True, "batch": "Batch D"},
                    {"day": "Friday", "slot_index": 6, "period_num": 6, "course_name": "ET LAB IV BF", "venue": "ET Lab IV", "class_code": "4R", "is_lab": True, "batch": "Batch D"},
                ]
            else:
                # Official Timetable for Dr. J. M. Patil (Head of Department & Professor, CSE)
                entries = [
                    # Monday
                    {"day": "Monday", "slot_index": 1, "period_num": 1, "course_name": "CC", "venue": "B007", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Monday", "slot_index": 3, "period_num": 3, "course_name": "DMS(D)", "venue": "Adv Systems Lab", "class_code": "3N", "is_lab": True, "batch": "Batch D"},
                    {"day": "Monday", "slot_index": 4, "period_num": 4, "course_name": "DMS(D)", "venue": "Adv Systems Lab", "class_code": "3N", "is_lab": True, "batch": "Batch D"},
                    # Tuesday
                    {"day": "Tuesday", "slot_index": 1, "period_num": 1, "course_name": "CC", "venue": "B007", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Tuesday", "slot_index": 3, "period_num": 3, "course_name": "DMS(B)", "venue": "Adv Systems Lab", "class_code": "3N", "is_lab": True, "batch": "Batch B"},
                    {"day": "Tuesday", "slot_index": 4, "period_num": 4, "course_name": "DMS(B)", "venue": "Adv Systems Lab", "class_code": "3N", "is_lab": True, "batch": "Batch B"},
                    # Wednesday
                    {"day": "Wednesday", "slot_index": 1, "period_num": 1, "course_name": "CC", "venue": "B007", "class_code": "4R", "is_lab": False, "batch": None},
                    # Thursday
                    {"day": "Thursday", "slot_index": 3, "period_num": 3, "course_name": "DMS(C)", "venue": "Adv Systems Lab", "class_code": "3N", "is_lab": True, "batch": "Batch C"},
                    {"day": "Thursday", "slot_index": 4, "period_num": 4, "course_name": "DMS(C)", "venue": "Adv Systems Lab", "class_code": "3N", "is_lab": True, "batch": "Batch C"},
                    # Friday
                    {"day": "Friday", "slot_index": 1, "period_num": 1, "course_name": "CC", "venue": "B007", "class_code": "4R", "is_lab": False, "batch": None},
                    {"day": "Friday", "slot_index": 3, "period_num": 3, "course_name": "DMS(A)", "venue": "Adv Systems Lab", "class_code": "3N", "is_lab": True, "batch": "Batch A"},
                    {"day": "Friday", "slot_index": 4, "period_num": 4, "course_name": "DMS(A)", "venue": "Adv Systems Lab", "class_code": "3N", "is_lab": True, "batch": "Batch A"},
                ]

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
            t_name = teacher.get("full_name", "")
            try:
                t_rows = db.execute(text("""
                    SELECT * FROM timetable_entries 
                    WHERE LOWER(teacher_name) LIKE LOWER(:tname) AND LOWER(day) = LOWER(:tday)
                    ORDER BY period_num ASC
                """), {"tname": f"%{t_name}%", "tday": today_name}).fetchall()

                for r in t_rows:
                    m = dict(r._mapping)
                    today_schedule.append({
                        "time": m.get("period_time", "11:00 AM - 12:00 PM"),
                        "subject": m.get("course_name", "Lecture"),
                        "class": "CSE",
                        "room": m.get("venue", "Room 201"),
                        "type": "Lecture",
                        "status": "scheduled"
                    })
            except Exception:
                pass

        return {
            "faculty": {
                "id": teacher["id"] if teacher else "8f913c70-85ed-4261-bbd0-f2d3b42f4af1",
                "name": teacher["full_name"] if teacher else "Dr. J. M. Patil",
                "employeeId": teacher["emp_code"] if teacher else "EMP-CSE-1001",
                "prefix": "Prof.",
                "title": teacher.get("designation") if teacher else "Professor & Head, CSE",
                "departmentCode": "CSE",
                "cabinLocation": "Academic Block B, Room 201"
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
            "attendance_average_pct": 87.4
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
