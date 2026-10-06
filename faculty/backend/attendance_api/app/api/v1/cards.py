import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.db_models import Teacher, ClassCard, Department, Class, Subject
from app.models.schema import ClassCardCreate, ClassCardUpdate
from app.database import get_supabase_client
from app.utils.response import success_response, error_response

logger = logging.getLogger("erp_fastapi")

router = APIRouter(prefix="/cards", tags=["Class Cards"])

@router.get("")
@router.get("/")
def get_cards(
    teacherId: Optional[str] = Query(None),
    current_user: Teacher = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch live teacher class cards from Supabase with database fallback."""
    try:
        sb = get_supabase_client()
        if sb:
            cards_res = sb.table("teacher_class_cards").select("*").execute()
            if cards_res.data is not None:
                # Fetch subjects and classes maps for enrichment
                subj_res = sb.table("subjects").select("code, name").execute()
                subj_dict = {s["code"]: s["name"] for s in (subj_res.data or [])}

                cls_res = sb.table("classes").select("code, room, name").execute()
                cls_dict = {c["code"]: c for c in (cls_res.data or [])}

                data = []
                for c in cards_res.data:
                    c_code = c.get("class_code", "")
                    s_code = c.get("subject_code", "")
                    cls_info = cls_dict.get(c_code, {})
                    dept_code = c.get("department_code") or "CSE"
                    dept_name = "Computer Science & Engineering" if dept_code == "CSE" else dept_code
                    s_name = subj_dict.get(s_code, s_code)
                    data.append({
                        "id": c.get("id"),
                        "teacher_id": current_user.emp_code,
                        "employee_id": current_user.emp_code,
                        "department": dept_code,
                        "department_name": dept_name,
                        "program": dept_code,
                        "program_name": dept_name,
                        "class": c_code,
                        "class_id": c_code,
                        "subject_code": s_code,
                        "subject_name": s_name,
                        "course_code": s_code,
                        "course_name": s_name,
                        "room_number": cls_info.get("room") or "Room 201",
                        "color_gradient": "from-blue-600 to-indigo-700",
                        "created_at": c.get("created_at") or ""
                    })
                return success_response(data=data)
    except Exception as e:
        logger.warning("[Cards] Supabase cards fetch error: %s", e)

    target_id = teacherId or current_user.id
    cards = db.query(ClassCard).filter(
        (ClassCard.teacher_id == target_id) | (ClassCard.teacher_id == current_user.id)
    ).order_by(ClassCard.sort_order).all()

    data = [
        {
            "id": c.id,
            "teacher_id": current_user.emp_code,
            "department": c.assigned_class.department.code if c.assigned_class and c.assigned_class.department else "CSE",
            "department_name": c.assigned_class.department.name if c.assigned_class and c.assigned_class.department else "Computer Science & Engineering",
            "class": c.assigned_class.name if c.assigned_class else "",
            "class_id": c.assigned_class.id if c.assigned_class else "",
            "subject_code": c.subject.code if c.subject else "",
            "subject_name": c.subject.name if c.subject else "",
            "room_number": c.room_number or "Room 201",
            "color_gradient": c.color_gradient or "from-blue-600 to-indigo-700",
            "created_at": c.created_at.isoformat() if c.created_at else ""
        }
        for c in cards
    ]
    return success_response(data=data)

@router.get("/check-duplicate")
def check_card_duplicate(
    department: str = Query(...),
    classId: str = Query(...),
    subjectCode: str = Query(...),
    current_user: Teacher = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        sb = get_supabase_client()
        if sb:
            res = sb.table("teacher_class_cards").select("id").match({
                "department_code": department,
                "class_code": classId,
                "subject_code": subjectCode
            }).execute()
            if res.data and len(res.data) > 0:
                return success_response(data={"isDuplicate": True})
    except Exception as e:
        logger.warning("[Cards] Check duplicate error: %s", e)

    cls = db.query(Class).filter((Class.name == classId) | (Class.id == classId)).first()
    subj = db.query(Subject).filter((Subject.code == subjectCode) | (Subject.id == subjectCode)).first()

    if not cls or not subj:
        return success_response(data={"isDuplicate": False})

    card = db.query(ClassCard).filter_by(
        teacher_id=current_user.id,
        class_id=cls.id,
        subject_id=subj.id
    ).first()

    return success_response(data={"isDuplicate": card is not None})

@router.post("")
@router.post("/")
def create_card(
    payload: ClassCardCreate,
    current_user: Teacher = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Save to Supabase
    try:
        sb = get_supabase_client()
        if sb:
            sb.table("teacher_class_cards").insert({
                "teacher_id": current_user.id,
                "department_code": payload.department,
                "class_code": payload.classId,
                "subject_code": payload.subjectCode
            }).execute()
    except Exception as e:
        logger.warning("[Cards] Supabase card insert notice: %s", e)

    # 2. Local DB mirror
    dept = db.query(Department).filter(
        (Department.code == payload.department) | (Department.id == payload.department)
    ).first()
    if not dept:
        dept = db.query(Department).first()

    cls = db.query(Class).filter(
        (Class.name == payload.classId) | (Class.id == payload.classId)
    ).first()
    if not cls and dept:
        cls = Class(department_id=dept.id, name=payload.classId, academic_year="2024-2025", total_students=60)
        db.add(cls)
        db.flush()

    subj = db.query(Subject).filter(
        (Subject.code == payload.subjectCode) | (Subject.id == payload.subjectCode)
    ).first()
    if not subj and dept:
        subj = Subject(
            department_id=dept.id,
            code=payload.subjectCode,
            name=payload.subjectName or f"Subject {payload.subjectCode}",
            semester=5,
            type="THEORY"
        )
        db.add(subj)
        db.flush()

    card = ClassCard(
        teacher_id=current_user.id,
        department_id=dept.id if dept else "",
        class_id=cls.id if cls else "",
        subject_id=subj.id if subj else "",
        room_number=payload.room or "Room 201",
        color_gradient=payload.colorGradient or "from-blue-600 to-indigo-700"
    )
    db.add(card)
    db.commit()
    db.refresh(card)

    return success_response(
        data={
            "id": card.id,
            "department": payload.department,
            "class": payload.classId,
            "subject_code": payload.subjectCode,
            "subject_name": payload.subjectName
        },
        message="Class card created successfully",
        code=201
    )

@router.delete("/{card_id}")
def delete_card(
    card_id: str,
    current_user: Teacher = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        sb = get_supabase_client()
        if sb:
            sb.table("teacher_class_cards").delete().eq("id", card_id).execute()
    except Exception as e:
        logger.warning("[Cards] Supabase card delete notice: %s", e)

    card = db.query(ClassCard).filter_by(id=card_id).first()
    if card:
        db.delete(card)
        db.commit()

    return success_response(message="Card deleted successfully")
