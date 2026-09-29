from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db, get_supabase_client
from app.models.db_models import (
    StudentProfile, TimetableEntry, SubjectSyllabus, FeeRecord, FeeReceipt,
    ElearningAssignment, ElearningContent, ElearningQuiz, ChangeInfoRequest,
    UpdationInfoRecord, StudentDocument, ExamMark, ExamRevaluation, StudentNotification
)
from app.models.schema import (
    ChangeInfoSubmit, UpdationInfoSubmit, DocumentUpload, RevaluationSubmit, FeePaymentIntent
)
from app.utils.response import success_response, error_response

router = APIRouter()

# ==============================================================================
# 1. PROFILE & AUTH
# ==============================================================================
@router.get("/profile")
def get_student_profile(db: Session = Depends(get_db)):
    student = db.query(StudentProfile).first()
    if not student:
        return error_response("Student profile not found", code=404)
    
    return success_response(data={
        "id": student.id,
        "rollNo": student.roll_no,
        "studentCode": student.student_code,
        "fullName": student.full_name,
        "email": student.email,
        "department": student.department,
        "className": student.class_name,
        "division": student.division,
        "semester": student.semester,
        "academicYear": student.academic_year,
        "prn": student.prn,
        "caste": student.caste,
        "isEmployeeWard": student.is_employee_ward,
        "phone": student.phone,
        "cgpa": student.cgpa,
        "sgpa": student.sgpa,
        "attendanceRate": student.attendance_rate,
        "avatarUrl": student.avatar_url
    })

# ==============================================================================
# 2. TIMETABLE
# ==============================================================================
@router.get("/timetable")
def get_timetable(day: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(TimetableEntry)
    if day:
        query = query.filter(TimetableEntry.day == day.lower())
    
    entries = query.all()
    days_data = {}
    for e in entries:
        d = e.day.lower()
        if d not in days_data:
            days_data[d] = []
        days_data[d].append({
            "num": e.period_num,
            "time": e.period_time,
            "code": e.course_code,
            "name": e.course_name,
            "venue": e.venue,
            "teacher": e.teacher_name,
            "status": e.status,
            "statusClass": e.status_class,
            "att": e.att_label,
            "isCompleted": e.is_completed,
            "isActiveNow": e.is_active_now,
            "isCritical": e.is_critical
        })
    
    return success_response(data=days_data)

# ==============================================================================
# 3. ATTENDANCE OVERVIEW & SUBJECT BREAKDOWN
# ==============================================================================
@router.get("/attendance")
def get_student_attendance(db: Session = Depends(get_db)):
    student = db.query(StudentProfile).first()
    rate = student.attendance_rate if student else 82.0

    subjects_att = [
        {"code": "CS-301", "name": "Data Structures & Algorithms", "attended": 38, "total": 43, "percentage": 88.4, "status": "Good Standing"},
        {"code": "CS-302", "name": "Object Oriented Programming (Java)", "attended": 36, "total": 43, "percentage": 83.7, "status": "Good Standing"},
        {"code": "CS-303", "name": "Operating System Principles", "attended": 34, "total": 43, "percentage": 79.1, "status": "Safe Zone"},
        {"code": "CS-304", "name": "Database Management Systems", "attended": 35, "total": 43, "percentage": 81.4, "status": "Good Standing"},
        {"code": "CS-305", "name": "Computer Networks & Protocols", "attended": 14, "total": 19, "percentage": 73.7, "status": "Critical (<75%)"},
    ]

    return success_response(data={
        "overallPercentage": rate,
        "attendedLectures": 157,
        "totalLectures": 191,
        "absentLectures": 34,
        "eligibilityStatus": "Eligible for Mid-Term Exams (Overall > 75%)",
        "defaulterAlert": "Attention: Computer Networks attendance is 73.7%. Attend next 2 lectures to cross 75%.",
        "subjectWise": subjects_att
    })

# ==============================================================================
# 4. SYLLABUS & CURRICULUM
# ==============================================================================
@router.get("/syllabus")
def get_syllabus(db: Session = Depends(get_db)):
    items = db.query(SubjectSyllabus).all()
    data = [
        {
            "id": s.id,
            "subjectCode": s.subject_code,
            "subjectName": s.subject_name,
            "credits": s.credits,
            "faculty": {
                "name": s.faculty_name,
                "designation": s.faculty_designation,
                "email": s.faculty_email,
                "cabin": s.faculty_cabin
            },
            "syllabusProgress": s.syllabus_progress,
            "curriculumPdfUrl": s.curriculum_pdf_url
        }
        for s in items
    ]
    return success_response(data=data)

# ==============================================================================
# 5. FEES & ACCOUNTS
# ==============================================================================
@router.get("/fees")
def get_fees_summary(db: Session = Depends(get_db)):
    rec = db.query(FeeRecord).first()
    receipts = db.query(FeeReceipt).all()

    summary = {
        "academicYear": rec.academic_year if rec else "2025-26",
        "semester": rec.semester if rec else 4,
        "tuitionFee": rec.tuition_fee if rec else 74500.0,
        "developmentFee": rec.development_fee if rec else 12000.0,
        "examFee": rec.exam_fee if rec else 2500.0,
        "gymkhanaFee": rec.gymkhana_fee if rec else 1500.0,
        "totalFee": rec.total_fee if rec else 90500.0,
        "paidAmount": rec.paid_amount if rec else 90500.0,
        "dueAmount": rec.due_amount if rec else 0.0,
        "status": rec.status if rec else "PAID"
    }

    receipt_list = [
        {
            "id": r.id,
            "receiptNo": r.receipt_no,
            "transactionId": r.transaction_id,
            "paymentDate": r.payment_date,
            "amount": r.amount,
            "paymentMode": r.payment_mode,
            "bankName": r.bank_name,
            "status": r.status,
            "downloadUrl": r.download_url
        }
        for r in receipts
    ]

    return success_response(data={
        "summary": summary,
        "receipts": receipt_list
    })

@router.post("/fees/pay")
def initiate_online_payment(payload: FeePaymentIntent):
    return success_response(data={
        "paymentGateway": "SBI ePay / Razorpay",
        "orderId": f"ORD-SSGMCE-{uuid_sample()}",
        "amount": payload.amount,
        "status": "INITIATED",
        "message": "Payment gateway session initiated successfully"
    })

def uuid_sample():
    import uuid
    return str(uuid.uuid4())[:8].upper()

# ==============================================================================
# 6. E-LEARNING (ASSIGNMENTS, E-CONTENT, QUIZZES)
# ==============================================================================
@router.get("/elearning")
def get_elearning(db: Session = Depends(get_db)):
    assignments = db.query(ElearningAssignment).all()
    content = db.query(ElearningContent).all()
    quizzes = db.query(ElearningQuiz).all()

    return success_response(data={
        "assignments": [
            {
                "id": a.id,
                "subjectCode": a.subject_code,
                "subjectName": a.subject_name,
                "title": a.title,
                "dueDate": a.due_date,
                "totalMarks": a.total_marks,
                "submissionStatus": a.submission_status,
                "grade": a.grade
            }
            for a in assignments
        ],
        "eContent": [
            {
                "id": c.id,
                "subjectCode": c.subject_code,
                "subjectName": c.subject_name,
                "title": c.title,
                "contentType": c.content_type,
                "uploadedAt": c.uploaded_at
            }
            for c in content
        ],
        "quizzes": [
            {
                "id": q.id,
                "subjectCode": q.subject_code,
                "title": q.title,
                "durationMins": q.duration_mins,
                "totalMarks": q.total_marks,
                "obtainedMarks": q.obtained_marks,
                "status": q.status
            }
            for q in quizzes
        ]
    })

# ==============================================================================
# 7. CHANGE INFORMATION
# ==============================================================================
@router.get("/change-info")
def get_change_info_requests(db: Session = Depends(get_db)):
    reqs = db.query(ChangeInfoRequest).all()
    data = [
        {
            "id": r.id,
            "fieldName": r.field_name,
            "currentValue": r.current_value,
            "requestedValue": r.requested_value,
            "reason": r.reason,
            "status": r.status,
            "submittedAt": r.submitted_at.isoformat() if r.submitted_at else ""
        }
        for r in reqs
    ]
    return success_response(data=data)

@router.post("/change-info")
def submit_change_info(payload: ChangeInfoSubmit, db: Session = Depends(get_db)):
    student = db.query(StudentProfile).first()
    curr_val = getattr(student, payload.fieldName.lower(), "Existing Data") if student else "Existing Data"

    req = ChangeInfoRequest(
        student_code="308637",
        field_name=payload.fieldName,
        current_value=str(curr_val),
        requested_value=payload.requestedValue,
        reason=payload.reason,
        proof_document_url=payload.proofDocumentUrl or "#",
        status="PENDING"
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    return success_response(data={"requestId": req.id}, message="Change request submitted to Dean Office for verification", code=201)

# ==============================================================================
# 8. UPDATION OF INFORMATION (ACTIVITIES / AICTE 100 POINTS)
# ==============================================================================
@router.get("/update-info")
def get_updation_records(db: Session = Depends(get_db)):
    records = db.query(UpdationInfoRecord).all()
    data = [
        {
            "id": r.id,
            "category": r.category,
            "title": r.title,
            "eventDate": r.event_date,
            "organization": r.organization,
            "description": r.description,
            "aictePoints": r.aicte_points,
            "status": r.status
        }
        for r in records
    ]
    return success_response(data=data)

@router.post("/update-info")
def submit_updation_record(payload: UpdationInfoSubmit, db: Session = Depends(get_db)):
    rec = UpdationInfoRecord(
        student_code="308637",
        category=payload.category,
        title=payload.title,
        event_date=payload.eventDate,
        organization=payload.organization,
        description=payload.description,
        certificate_url=payload.certificateUrl or "#",
        aicte_points=10,
        status="VERIFIED"
    )
    db.add(rec)
    db.commit()
    return success_response(message="Activity portfolio record added successfully", code=201)

# ==============================================================================
# 9. D-WALLET (SUPABASE public.student_documents INTEGRATION)
# ==============================================================================
@router.get("/dwallet")
def get_dwallet_documents(db: Session = Depends(get_db)):
    # Try fetching from Supabase table first if available
    try:
        supabase = get_supabase_client()
        if supabase:
            res = supabase.table("student_documents").select("*").execute()
            if res and res.data:
                return success_response(data=res.data)
    except Exception:
        pass

    # Local fallback
    docs = db.query(StudentDocument).all()
    data = [
        {
            "id": d.id,
            "documentName": d.document_name,
            "category": d.category,
            "fileSize": d.file_size,
            "isVerified": d.is_verified,
            "uploadDate": d.upload_date
        }
        for d in docs
    ]
    return success_response(data=data)

@router.post("/dwallet/upload")
def upload_dwallet_document(payload: DocumentUpload, db: Session = Depends(get_db)):
    # Try syncing to Supabase table
    try:
        supabase = get_supabase_client()
        if supabase:
            supabase.table("student_documents").insert({
                "student_code": "308637",
                "document_name": payload.documentName,
                "category": payload.category,
                "file_url": payload.fileUrl,
                "is_verified": True
            }).execute()
    except Exception:
        pass

    doc = StudentDocument(
        student_code="308637",
        document_name=payload.documentName,
        category=payload.category,
        file_url=payload.fileUrl,
        file_size="1.5 MB",
        is_verified=True,
        upload_date="Just now"
    )
    db.add(doc)
    db.commit()
    return success_response(message="Document uploaded and verified in D-Wallet", code=201)

# ==============================================================================
# 10. EXAMINATION CELL
# ==============================================================================
@router.get("/examination")
def get_examination_details(db: Session = Depends(get_db)):
    marks = db.query(ExamMark).all()
    revals = db.query(ExamRevaluation).all()

    return success_response(data={
        "semester": 4,
        "academicYear": "2025-26",
        "hallTicketStatus": "AVAILABLE_FOR_DOWNLOAD",
        "backlogStatus": "ALL_CLEAR (0 Backlogs)",
        "marks": [
            {
                "id": m.id,
                "subjectCode": m.subject_code,
                "subjectName": m.subject_name,
                "cie1Score": m.cie1_score,
                "cie2Score": m.cie2_score,
                "taScore": m.ta_score,
                "totalInternal": m.total_internal,
                "grade": m.grade,
                "gradePoints": m.grade_points
            }
            for m in marks
        ],
        "revaluationApplications": [
            {
                "id": r.id,
                "subjectCode": r.subject_code,
                "subjectName": r.subject_name,
                "examSession": r.exam_session,
                "currentMarks": r.current_marks,
                "status": r.status
            }
            for r in revals
        ]
    })

@router.post("/examination/revaluation")
def submit_revaluation(payload: RevaluationSubmit, db: Session = Depends(get_db)):
    reval = ExamRevaluation(
        student_code="308637",
        subject_code=payload.subjectCode,
        subject_name=payload.subjectName,
        application_type=payload.applicationType,
        status="UNDER_PROCESS"
    )
    db.add(reval)
    db.commit()
    return success_response(message="Revaluation application submitted to Controller of Examinations", code=201)

# ==============================================================================
# 11. NOTIFICATIONS
# ==============================================================================
@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    notes = db.query(StudentNotification).order_by(StudentNotification.created_at.desc()).all()
    data = [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "category": n.category,
            "isRead": n.is_read
        }
        for n in notes
    ]
    return success_response(data=data)
