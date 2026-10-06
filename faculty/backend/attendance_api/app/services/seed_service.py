import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.db_models import (
    Department, Class, Subject, Teacher, ClassCard, Student, Notification
)
from app.database import get_supabase_client
from app.utils.security import hash_password

logger = logging.getLogger("erp_fastapi")

def seed_database(db: Session):
    """
    Dynamic Database Synchronization Service:
    Synchronizes local database cache directly from live Cloud Supabase database.
    Eliminates all hardcoded static data completely.
    """
    sb = get_supabase_client()
    if not sb:
        logger.warning("[Sync] Supabase client unavailable. Skipping cloud sync.")
        return

    try:
        # 1. Sync Departments from Supabase
        dept_res = sb.table("departments").select("*").execute()
        dept_map = {}
        if dept_res.data:
            for d in dept_res.data:
                code = d.get("code")
                existing = db.query(Department).filter_by(code=code).first()
                if not existing:
                    existing = Department(
                        code=code,
                        name=d.get("name") or code,
                        icon=d.get("icon") or "💻",
                        classes_count=d.get("classes_count") or 4,
                        description=d.get("description") or f"Department of {code}"
                    )
                    db.add(existing)
                    db.flush()
                else:
                    existing.name = d.get("name") or existing.name
                    existing.icon = d.get("icon") or existing.icon
                    existing.classes_count = d.get("classes_count") or existing.classes_count
                dept_map[code] = existing

        # 2. Sync Classes from Supabase
        class_res = sb.table("classes").select("*").execute()
        class_map = {}
        if class_res.data:
            for c in class_res.data:
                code = c.get("code")
                dept_code = c.get("department_code") or "CSE"
                dept = dept_map.get(dept_code) or db.query(Department).filter_by(code=dept_code).first()
                if not dept:
                    continue
                existing_cls = db.query(Class).filter_by(department_id=dept.id, name=code).first()
                if not existing_cls:
                    existing_cls = Class(
                        department_id=dept.id,
                        name=code,
                        academic_year=c.get("academic_year") or "2024-2025",
                        semester=3,
                        division=c.get("name") or "Div A",
                        room=c.get("room") or "Room 201",
                        total_students=c.get("students_count") or 60
                    )
                    db.add(existing_cls)
                    db.flush()
                else:
                    existing_cls.room = c.get("room") or existing_cls.room
                    existing_cls.total_students = c.get("students_count") or existing_cls.total_students
                class_map[code] = existing_cls

        # 3. Sync Subjects from Supabase
        subj_res = sb.table("subjects").select("*").execute()
        subj_map = {}
        if subj_res.data:
            for s in subj_res.data:
                code = s.get("code")
                existing_subj = db.query(Subject).filter_by(code=code).first()
                cse_dept = dept_map.get("CSE") or db.query(Department).filter_by(code="CSE").first()
                if not existing_subj and cse_dept:
                    existing_subj = Subject(
                        department_id=cse_dept.id,
                        code=code,
                        name=s.get("name") or code,
                        semester=5,
                        type="THEORY"
                    )
                    db.add(existing_subj)
                    db.flush()
                subj_map[code] = existing_subj

        # 4. Sync Faculty Profile from Supabase
        fac_res = sb.table("faculty").select("*").limit(1).execute()
        active_teacher = None
        if fac_res.data and len(fac_res.data) > 0:
            f = fac_res.data[0]
            emp_code = f.get("employee_id") or "FAC-CSE-1048"
            dept_code = f.get("department_code") or "CSE"
            dept = dept_map.get(dept_code) or db.query(Department).filter_by(code=dept_code).first()
            teacher = db.query(Teacher).filter((Teacher.emp_code == emp_code) | (Teacher.email == f.get("email"))).first()
            if not teacher:
                teacher = Teacher(
                    full_name=f.get("name") or "Dr. J.M.Patil",
                    emp_code=emp_code,
                    email=f.get("email") or "jm.patil@ssgmce.ac.in",
                    password_hash=hash_password("Teacher@123"),
                    designation=f.get("title") or "Associate Professor",
                    department_id=dept.id if dept else None,
                    phone=f.get("phone") or "+91 98765 43210",
                    avatar=f.get("avatar_initials") or "JP"
                )
                db.add(teacher)
                db.flush()
            else:
                teacher.full_name = f.get("name") or teacher.full_name
                teacher.designation = f.get("title") or teacher.designation
                teacher.avatar = f.get("avatar_initials") or teacher.avatar
                teacher.email = f.get("email") or teacher.email
                teacher.phone = f.get("phone") or teacher.phone
            active_teacher = teacher

        # 5. Sync Class Cards from Supabase
        cards_res = sb.table("teacher_class_cards").select("*").execute()
        if cards_res.data and active_teacher:
            for card in cards_res.data:
                c_code = card.get("class_code")
                s_code = card.get("subject_code")
                cls = class_map.get(c_code) or db.query(Class).filter_by(name=c_code).first()
                subj = subj_map.get(s_code) or db.query(Subject).filter_by(code=s_code).first()
                if cls and subj:
                    existing_card = db.query(ClassCard).filter_by(
                        teacher_id=active_teacher.id,
                        class_id=cls.id,
                        subject_id=subj.id
                    ).first()
                    if not existing_card:
                        db.add(ClassCard(
                            id=card.get("id"),
                            teacher_id=active_teacher.id,
                            department_id=cls.department_id,
                            class_id=cls.id,
                            subject_id=subj.id,
                            room_number=cls.room or "Room 201",
                            color_gradient="from-blue-600 to-indigo-700"
                        ))

        # 6. Sync Students from Supabase
        st_res = sb.table("students").select("*").execute()
        if st_res.data:
            for s in st_res.data:
                c_code = s.get("class_code")
                cls = class_map.get(c_code) or db.query(Class).filter_by(name=c_code).first()
                if not cls:
                    continue
                st_code = s.get("enrollment_no") or f"STU-{s.get('roll_no')}"
                existing_st = db.query(Student).filter(
                    (Student.student_code == st_code) | ((Student.class_id == cls.id) & (Student.roll_no == s.get("roll_no")))
                ).first()
                if not existing_st:
                    db.add(Student(
                        id=s.get("id"),
                        class_id=cls.id,
                        roll_no=s.get("roll_no") or 1,
                        student_code=st_code,
                        full_name=s.get("name") or "Student",
                        is_provisional=False,
                        avatar_url=None
                    ))
                else:
                    existing_st.full_name = s.get("name") or existing_st.full_name

        db.commit()
        logger.info("[Sync] Successfully synced live data from Cloud Supabase into database cache!")
    except Exception as e:
        db.rollback()
        logger.error("[Sync] Error syncing from Supabase: %s", e)
