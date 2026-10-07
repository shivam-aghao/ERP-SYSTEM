from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException
from backend.schemas.auth import LoginRequest

class AuthService:
    @staticmethod
    def authenticate_user(payload: LoginRequest, db: Session) -> Dict[str, Any]:
        uid = (payload.user_id or payload.username or payload.roll_number or payload.email or "").strip()
        pwd = (payload.password or "").strip()
        hint_role = (payload.role or "").strip().lower()

        # 1. Check Administrator
        if uid.lower() in ("admin", "administrator", "superadmin", "adm") or hint_role == "admin":
            admin_row = None
            try:
                admin_row = db.execute(
                    text("SELECT * FROM admins WHERE LOWER(username) = LOWER(:uid) OR LOWER(email) = LOWER(:uid) OR id = :uid LIMIT 1"),
                    {"uid": uid}
                ).fetchone()
            except Exception:
                pass
            admin_id = str(admin_row._mapping.get("id")) if admin_row else "admin-root-001"
            admin_name = admin_row._mapping.get("name") if admin_row else "System Administrator"
            return {
                "token": f"adm_token_{admin_id}",
                "user": {
                    "id": admin_id,
                    "name": admin_name,
                    "full_name": admin_name,
                    "username": "admin",
                    "role": "admin"
                },
                "role": "admin",
                "redirect": "admin-dashboard.html"
            }

        # 2. Check Teacher / Faculty in database
        teacher_row = None
        try:
            teacher_row = db.execute(
                text("""
                    SELECT * FROM teachers 
                    WHERE LOWER(emp_code) = LOWER(:uid) 
                       OR LOWER(email) = LOWER(:uid) 
                       OR id = :uid 
                       OR LOWER(full_name) LIKE LOWER(:uid_pattern)
                    LIMIT 1
                """),
                {"uid": uid, "uid_pattern": f"%{uid}%"}
            ).fetchone()
        except Exception:
            pass

        if not teacher_row and (
            uid.lower() in ("teacher", "faculty", "fac", "prof", "employee", "staff", "rohan.deshmukh@ssgmce.ac.in", "fac-cse-1048", "emp-cse-1048")
            or uid.lower().startswith("teach")
            or uid.lower().startswith("fac")
            or uid.lower().startswith("emp")
            or "deshmukh" in uid.lower()
            or hint_role in ("teacher", "faculty", "employee")
        ):
            try:
                teacher_row = db.execute(text("SELECT * FROM teachers WHERE emp_code = 'FAC-CSE-1048' OR emp_code = 'EMP-CSE-1042' LIMIT 1")).fetchone()
                if not teacher_row:
                    teacher_row = db.execute(text("SELECT * FROM teachers LIMIT 1")).fetchone()
            except Exception:
                pass

        if teacher_row:
            m = teacher_row._mapping
            t_name = m.get("full_name") or f"{m.get('first_name', '')} {m.get('last_name', '')}".strip() or "Dr. Rohan Deshmukh"
            return {
                "token": f"teach_token_{m.get('id', 'a0000000-0000-0000-0000-000000000001')}",
                "user": {
                    "id": m.get("id", "a0000000-0000-0000-0000-000000000001"),
                    "name": t_name,
                    "full_name": t_name,
                    "email": m.get("email", "rohan.deshmukh@ssgmce.ac.in"),
                    "emp_code": m.get("emp_code", uid or "FAC-CSE-1048"),
                    "department": m.get("department_id", "CSE"),
                    "role": "teacher"
                },
                "role": "teacher",
                "redirect": "teacher-dashboard.html"
            }

<<<<<<< HEAD
        # 3. Check Student aliases or in database
        if uid.lower() in ("student", "learner", "std"):
            student_row = db.execute(text("SELECT s.*, c.class_name, c.division as class_div FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()
        else:
            student_row = db.execute(
                text("""
                    SELECT s.*, c.class_name, c.division as class_div
                    FROM students s
                    LEFT JOIN classes c ON s.class_id = c.id
                    WHERE LOWER(s.student_code) = LOWER(:uid) OR LOWER(s.sis_id) = LOWER(:uid) OR LOWER(s.email) = LOWER(:uid) OR s.id = :uid OR s.roll_no = :uid
                    LIMIT 1
                """),
                {"uid": uid}
            ).fetchone()
=======
        # If faculty matched pattern but not in db, return fallback faculty
        if (
            uid.lower() in ("teacher", "faculty", "fac", "prof", "employee", "staff", "rohan.deshmukh@ssgmce.ac.in", "fac-cse-1048", "emp-cse-1048")
            or uid.lower().startswith("teach")
            or uid.lower().startswith("fac")
            or uid.lower().startswith("emp")
            or "deshmukh" in uid.lower()
            or hint_role in ("teacher", "faculty", "employee")
        ):
            return {
                "token": "teach_token_a0000000-0000-0000-0000-000000000001",
                "user": {
                    "id": "a0000000-0000-0000-0000-000000000001",
                    "name": "Dr. Rohan Deshmukh",
                    "full_name": "Dr. Rohan Deshmukh",
                    "email": "rohan.deshmukh@ssgmce.ac.in",
                    "emp_code": "FAC-CSE-1048",
                    "department": "CSE",
                    "role": "teacher"
                },
                "role": "teacher",
                "redirect": "teacher-dashboard.html"
            }

        # 3. Check Student in database
        student_row = None
        try:
            if uid.lower() in ("student", "learner", "std"):
                student_row = db.execute(
                    text("SELECT s.*, c.class_name, c.division as class_div FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.student_code = '308979' OR s.student_code = '308637' LIMIT 1")
                ).fetchone()
                if not student_row:
                    student_row = db.execute(text("SELECT s.*, c.class_name, c.division as class_div FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()
            else:
                student_row = db.execute(
                    text("""
                        SELECT s.*, c.class_name, c.division as class_div
                        FROM students s
                        LEFT JOIN classes c ON s.class_id = c.id
                        WHERE LOWER(s.student_code) = LOWER(:uid) 
                           OR LOWER(s.sis_id) = LOWER(:uid) 
                           OR LOWER(s.email) = LOWER(:uid) 
                           OR s.id = :uid 
                           OR s.roll_no = :uid
                        LIMIT 1
                    """),
                    {"uid": uid}
                ).fetchone()
        except Exception:
            pass

>>>>>>> 6b0c02d9a501abd8d11477e39456e96e70766c43

        if student_row:
            m = student_row._mapping
            s_name = m.get("full_name") or m.get("name") or "Shivam Sanjay Aghao"
            return {
                "token": f"st_token_{m.get('id', 's0000000-0000-0000-0000-000000000001')}",
                "user": {
                    "id": m.get("id", "s0000000-0000-0000-0000-000000000001"),
                    "student_code": m.get("student_code", uid or "308637"),
                    "full_name": s_name,
                    "name": s_name,
                    "roll_no": m.get("roll_no", 60),
                    "class_name": m.get("class_name") or "3R",
                    "class_id": m.get("class_id"),
                    "division": m.get("division") or m.get("class_div") or "1",
                    "email": m.get("email", ""),
                    "role": "student"
                },
                "role": "student",
                "redirect": "student-dashboard.html"
            }

<<<<<<< HEAD
        # 4. Fallback resolution if role hint is explicitly provided
        if hint_role in ("faculty", "teacher"):
            fallback_teacher = db.execute(text("SELECT * FROM teachers LIMIT 1")).fetchone()
            if fallback_teacher:
                m = fallback_teacher._mapping
                t_name = m.get("full_name") or "Faculty Member"
                return {
                    "token": f"teach_token_{m['id']}",
                    "user": {
                        "id": m["id"],
                        "name": t_name,
                        "full_name": t_name,
                        "email": m.get("email", ""),
                        "emp_code": m.get("emp_code") or uid,
                        "department": m.get("department_id", "CSE"),
                        "role": "teacher"
                    },
                    "role": "teacher",
                    "redirect": "teacher-dashboard.html"
                }

        if hint_role == "admin":
=======
        # Fallback to student if any user input provided
        if uid:
>>>>>>> 6b0c02d9a501abd8d11477e39456e96e70766c43
            return {
                "token": "st_token_s0000000-0000-0000-0000-000000000001",
                "user": {
<<<<<<< HEAD
                    "id": "admin-001",
                    "name": "Administrator",
                    "full_name": "Administrator",
                    "role": "admin"
                },
                "role": "admin",
                "redirect": "admin-dashboard.html"
            }

        # Default fallback to first student if any input was given, or raise 401 if blank
        fallback_st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()
        if fallback_st and uid:
            m = fallback_st._mapping
            s_name = m.get("full_name") or m.get("name") or "Student"
            return {
                "token": f"st_token_{m['id']}",
                "user": {
                    "id": m["id"],
                    "student_code": m.get("student_code") or uid,
                    "full_name": s_name,
                    "name": s_name,
                    "roll_no": m.get("roll_no") or 1,
                    "class_name": m.get("class_name") or "",
                    "class_id": m.get("class_id"),
=======
                    "id": "s0000000-0000-0000-0000-000000000001",
                    "student_code": uid,
                    "full_name": "Shivam Sanjay Aghao",
                    "name": "Shivam Sanjay Aghao",
                    "roll_no": 60,
                    "class_name": "3R",
                    "class_id": "c3r1",
>>>>>>> 6b0c02d9a501abd8d11477e39456e96e70766c43
                    "role": "student"
                },
                "role": "student",
                "redirect": "student-dashboard.html"
            }

        raise HTTPException(status_code=401, detail="Invalid user credentials. Please enter a valid ID and password.")
