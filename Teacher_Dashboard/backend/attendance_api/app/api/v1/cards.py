from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.db_models import Teacher, ClassCard, Department, Class, Subject
from app.models.schema import ClassCardCreate, ClassCardUpdate
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/cards", tags=["Class Cards"])

@router.get("")
@router.get("/")
def get_cards(
    teacherId: Optional[str] = Query(None),
    current_user: Teacher = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
            "class": c.assigned_class.name if c.assigned_class else "3R",
            "class_id": c.assigned_class.id if c.assigned_class else "",
            "subject_code": c.subject.code if c.subject else "CS305",
            "subject_name": c.subject.name if c.subject else "Database Management",
            "room_number": c.room_number or "Hall C",
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
    # Find class and subject
    cls = db.query(Class).filter(
        (Class.name == classId) | (Class.id == classId)
    ).first()
    subj = db.query(Subject).filter(
        (Subject.code == subjectCode) | (Subject.id == subjectCode)
    ).first()

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
    dept = db.query(Department).filter(
        (Department.code == payload.department) | (Department.id == payload.department)
    ).first()
    if not dept:
        dept = db.query(Department).first()

    cls = db.query(Class).filter(
        (Class.name == payload.classId) | (Class.id == payload.classId)
    ).first()
    if not cls:
        cls = Class(department_id=dept.id, name=payload.classId, academic_year="2025-26", total_students=60)
        db.add(cls)
        db.flush()

    subj = db.query(Subject).filter(
        (Subject.code == payload.subjectCode) | (Subject.id == payload.subjectCode)
    ).first()
    if not subj:
        subj = Subject(
            department_id=dept.id,
            code=payload.subjectCode,
            name=payload.subjectName or f"Subject {payload.subjectCode}",
            semester=5,
            type="THEORY"
        )
        db.add(subj)
        db.flush()

    # Check duplicate
    existing = db.query(ClassCard).filter_by(
        teacher_id=current_user.id,
        class_id=cls.id,
        subject_id=subj.id
    ).first()
    if existing:
        return error_response("Class card for this class and subject already exists", code=409)

    card = ClassCard(
        teacher_id=current_user.id,
        department_id=dept.id,
        class_id=cls.id,
        subject_id=subj.id,
        room_number=payload.roomNumber or "Hall C",
        color_gradient=payload.colorGradient or "from-blue-600 to-indigo-700",
        sort_order=db.query(ClassCard).filter_by(teacher_id=current_user.id).count() + 1
    )
    db.add(card)
    db.commit()
    db.refresh(card)

    return success_response(data={
        "id": card.id,
        "teacher_id": current_user.emp_code,
        "department": dept.code,
        "department_name": dept.name,
        "class": cls.name,
        "subject_code": subj.code,
        "subject_name": subj.name,
        "room_number": card.room_number,
        "color_gradient": card.color_gradient,
        "created_at": card.created_at.isoformat()
    }, message="Class card created successfully", code=201)

@router.put("/{card_id}")
def update_card(
    card_id: str,
    payload: ClassCardUpdate,
    current_user: Teacher = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    card = db.query(ClassCard).filter_by(id=card_id, teacher_id=current_user.id).first()
    if not card:
        return error_response("Card not found", code=404)

    if payload.roomNumber is not None:
        card.room_number = payload.roomNumber
    if payload.colorGradient is not None:
        card.color_gradient = payload.colorGradient
    if payload.sortOrder is not None:
        card.sort_order = payload.sortOrder

    db.commit()
    return success_response(message="Card updated successfully")

@router.delete("/{card_id}")
def delete_card(
    card_id: str,
    current_user: Teacher = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    card = db.query(ClassCard).filter_by(id=card_id, teacher_id=current_user.id).first()
    if not card:
        return error_response("Card not found", code=404)

    db.delete(card)
    db.commit()
    return success_response(message="Card deleted successfully")
