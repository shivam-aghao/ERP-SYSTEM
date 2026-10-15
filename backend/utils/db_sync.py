import os
import sqlite3
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("ssgmce_erp_backend.db_sync")

def get_db_path() -> str:
    return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "erp.db")


def ensure_sqlite_schema():
    """Ensures local SQLite database tables have required auth and ERP columns."""
    db_path = get_db_path()
    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    try:
        # 1. Teachers schema
        c.execute("PRAGMA table_info(teachers)")
        cols = [r[1] for r in c.fetchall()]
        if 'password' not in cols:
            c.execute("ALTER TABLE teachers ADD COLUMN password VARCHAR(100) DEFAULT 'teacher@123'")
            c.execute("UPDATE teachers SET password = 'teacher@123' WHERE password IS NULL")
        if 'emp_code' not in cols:
            c.execute("ALTER TABLE teachers ADD COLUMN emp_code VARCHAR(50)")
        if 'full_name' not in cols:
            c.execute("ALTER TABLE teachers ADD COLUMN full_name VARCHAR(100)")

        # 2. Students schema
        c.execute("PRAGMA table_info(students)")
        s_cols = [r[1] for r in c.fetchall()]
        if 'password' not in s_cols:
            c.execute("ALTER TABLE students ADD COLUMN password VARCHAR(100) DEFAULT 'ssgmce@123'")
            c.execute("UPDATE students SET password = 'ssgmce@123' WHERE password IS NULL")
        if 'class_name' not in s_cols:
            c.execute("ALTER TABLE students ADD COLUMN class_name VARCHAR(50) DEFAULT '2R1'")

        conn.commit()
    except Exception as e:
        logger.warning("Error in ensure_sqlite_schema: %s", e)
    finally:
        conn.close()


def sync_supabase_to_local(sb_client=None):
    """
    Bi-directional synchronization: Pulls live records from Supabase Cloud
    into the local database to ensure 100% data consistency.
    """
    if sb_client is None:
        try:
            from backend.config.database import get_supabase_client
            sb_client = get_supabase_client()
        except Exception as e:
            logger.debug("Could not import get_supabase_client: %s", e)
            return

    if not sb_client:
        logger.info("Supabase client unavailable for sync.")
        return

    db_path = get_db_path()
    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    try:
        # 1. Sync Teachers from Supabase
        res_t = sb_client.table("teachers").select("*").execute()
        if res_t.data:
            t_count = 0
            for t in res_t.data:
                t_id = str(t.get("id"))
                emp = t.get("emp_code") or f"EMP-CSE-{t_id[:4]}"
                name = t.get("full_name") or "Faculty Member"
                email = t.get("email") or f"{emp.lower()}@ssgmce.ac.in"
                pwd = t.get("password") or "teacher@123"
                desig = t.get("designation") or "Assistant Professor"
                parts = name.split()
                fname = parts[0] if parts else "Faculty"
                lname = " ".join(parts[1:]) if len(parts) > 1 else "Member"

                c.execute("""
                    INSERT INTO teachers (id, first_name, last_name, emp_code, teacher_code, full_name, email, password, designation, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                    ON CONFLICT(id) DO UPDATE SET
                        first_name = excluded.first_name,
                        last_name = excluded.last_name,
                        emp_code = excluded.emp_code,
                        full_name = excluded.full_name,
                        email = excluded.email,
                        password = excluded.password,
                        designation = excluded.designation
                """, (t_id, fname, lname, emp, emp, name, email, pwd, desig))
                t_count += 1
            conn.commit()
            logger.info("Synced %d teachers from Supabase Cloud into local database.", t_count)

        # 2. Sync Classes from Supabase
        res_cls = sb_client.table("classes").select("*").execute()
        if res_cls.data:
            cls_count = 0
            for cl in res_cls.data:
                c_id = str(cl.get("id"))
                c_name = cl.get("class_name") or cl.get("name") or "2R1"
                full_name = cl.get("name") or c_name
                dept_id = str(cl.get("department_id") or "")
                ay = cl.get("academic_year") or "2026-2027"
                sem = cl.get("semester") or 3
                div = cl.get("division") or "A"
                room = cl.get("room") or "LH-201"
                tot = cl.get("total_students") or 60

                c.execute("""
                    INSERT INTO classes (id, department_id, class_name, name, academic_year, semester, division, room, total_students)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        class_name = excluded.class_name,
                        name = excluded.name,
                        academic_year = excluded.academic_year,
                        semester = excluded.semester,
                        division = excluded.division,
                        room = excluded.room,
                        total_students = excluded.total_students
                """, (c_id, dept_id, c_name, full_name, ay, sem, div, room, tot))
                cls_count += 1
            conn.commit()
            logger.info("Synced %d classes from Supabase Cloud into local database.", cls_count)

        # 3. Sync Students from Supabase (sample/active roster)
        res_st = sb_client.table("students").select("*").limit(400).execute()
        if res_st.data:
            st_count = 0
            for s in res_st.data:
                s_id = str(s.get("id"))
                code = s.get("student_code") or f"ST-{s_id[:6]}"
                name = s.get("full_name") or "Student"
                roll = s.get("roll_no") or 1
                cls_id = str(s.get("class_id") or "")
                cls_name = s.get("class_name") or "2R1"
                email = s.get("email") or f"{code.lower()}@ssgmce.ac.in"
                pwd = s.get("password") or "ssgmce@123"
                div = s.get("division") or "A"

                c.execute("""
                    INSERT INTO students (id, class_id, roll_no, student_code, full_name, email, status, division, class_name, password)
                    VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        student_code = excluded.student_code,
                        full_name = excluded.full_name,
                        roll_no = excluded.roll_no,
                        class_name = excluded.class_name,
                        email = excluded.email,
                        password = excluded.password,
                        division = excluded.division
                """, (s_id, cls_id, roll, code, name, email, div, cls_name, pwd))
                st_count += 1
            conn.commit()
            logger.info("Synced %d students from Supabase Cloud into local database.", st_count)

    except Exception as e:
        logger.warning("Notice on live Supabase Cloud synchronization: %s", e)
    finally:
        conn.close()


def push_teacher_to_supabase(teacher_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Pushes a new or updated teacher record to Supabase Cloud."""
    try:
        from backend.config.database import get_supabase_client
        sb = get_supabase_client()
        if not sb:
            return None
        res = sb.table("teachers").upsert(teacher_data, on_conflict="emp_code").execute()
        return res.data[0] if res.data else None
    except Exception as e:
        logger.warning("Could not push teacher to Supabase: %s", e)
        return None


if __name__ == "__main__":
    ensure_sqlite_schema()
    sync_supabase_to_local()
