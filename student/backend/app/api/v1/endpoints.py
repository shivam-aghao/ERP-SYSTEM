from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Path, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import (
    StudentProfile, FeeRecord, FeeReceipt, ElearningAssignment,
    ElearningContent, ElearningQuiz, ChangeInfoRequest, UpdationInfoRecord,
    StudentDocument, ExamMark, ExamRevaluation
)
from app.models.schema import (
    ChangeInfoSubmit, UpdationInfoSubmit, DocumentUpload,
    RevaluationSubmit, FeePaymentIntent, StudentProfileUpdate
)
from app.services.supabase_service import supabase_service
from app.utils.response import success_response, error_response

router = APIRouter()

# ==============================================================================
# 0. HEALTH & STATUS
# ==============================================================================
@router.get("/health", tags=["Health"])
def get_service_health():
    """Checks FastAPI server status and live Supabase PostgreSQL connectivity."""
    status = supabase_service.check_connection()
    return success_response(
        data=status,
        message="Student ERP API is healthy and operational"
    )

@router.get("/status", tags=["Health"])
def get_detailed_status(db: Session = Depends(get_db)):
    """Provides detailed system telemetry including database tables and Supabase metrics."""
    sb_status = supabase_service.check_connection()
    return success_response(
        data={
            "service": "SSGMCE Student ERP Dashboard Backend",
            "version": "1.1.0",
            "framework": "FastAPI + Supabase PostgreSQL",
            "supabase": sb_status,
            "localSqliteReady": True
        }
    )

# ==============================================================================
# 1. PROFILE & AUTH
# ==============================================================================
@router.get("/profile", tags=["Profile"])
def get_student_profile(
    student_code: str = Query("308637", description="Student enrollment / code"),
    db: Session = Depends(get_db)
):
    """Fetches full student profile from Supabase with SQLite fallback."""
    profile_data, meta = supabase_service.get_profile(student_code=student_code, db=db)
    if not profile_data:
        return error_response("Student profile not found", code=404)
    return success_response(data=profile_data, message="Student profile loaded successfully", meta=meta)

@router.put("/profile", tags=["Profile"])
@router.post("/profile/update", tags=["Profile"])
def update_student_profile(
    payload: StudentProfileUpdate,
    student_code: str = Query("308637"),
    db: Session = Depends(get_db)
):
    """Updates student profile fields across Supabase and local storage."""
    update_dict = payload.model_dump(exclude_unset=True)
    success, msg = supabase_service.update_profile(student_code=student_code, updates=update_dict, db=db)
    # Return updated profile
    profile_data, meta = supabase_service.get_profile(student_code=student_code, db=db)
    return success_response(data=profile_data, message=msg, meta=meta)

# ==============================================================================
# 2. ACADEMIC METRICS & DASHBOARD OVERVIEW
# ==============================================================================
@router.get("/metrics", tags=["Academics"])
@router.get("/academic-metrics", tags=["Academics"])
def get_academic_metrics(
    student_code: str = Query("308637"),
    db: Session = Depends(get_db)
):
    """Returns official autonomous CGPA, semester SGPAs, credits, and standing."""
    metrics, meta = supabase_service.get_academic_metrics(student_code=student_code, db=db)
    return success_response(data=metrics, message="Academic metrics retrieved", meta=meta)

@router.get("/overview", tags=["Dashboard"])
def get_dashboard_overview(
    student_code: str = Query("308637"),
    db: Session = Depends(get_db)
):
    """Single-call consolidated endpoint returning student profile, metrics, timetable, and alerts."""
    overview = supabase_service.get_dashboard_overview(student_code=student_code, db=db)
    return success_response(data=overview, message="Dashboard overview aggregated successfully")

# ==============================================================================
# 3. TIMETABLE
# ==============================================================================
@router.get("/timetable", tags=["Timetable"])
def get_timetable(
    day: Optional[str] = Query(None, description="Day of week (e.g. 'Monday', 'Tuesday')"),
    db: Session = Depends(get_db)
):
    """Returns timetable periods mapped by weekday from Supabase or local timetable schedule."""
    data, meta = supabase_service.get_timetable(day=day, db=db)
    return success_response(data=data, message="Timetable fetched successfully", meta=meta)

# ==============================================================================
# 4. ATTENDANCE OVERVIEW & SUBJECT BREAKDOWN
# ==============================================================================
@router.get("/attendance", tags=["Attendance"])
def get_student_attendance(
    student_code: str = Query("308637"),
    db: Session = Depends(get_db)
):
    """Fetches overall attendance statistics, subject-level period counts, and eligibility."""
    data, meta = supabase_service.get_attendance(student_code=student_code, db=db)
    return success_response(data=data, message="Attendance records retrieved", meta=meta)

# ==============================================================================
# 5. SYLLABUS & CURRICULUM
# ==============================================================================
@router.get("/syllabus", tags=["Curriculum"])
def get_syllabus(db: Session = Depends(get_db)):
    """Returns autonomous engineering syllabus, textbook references, and faculty credits."""
    data, meta = supabase_service.get_syllabus(db=db)
    return success_response(data=data, message="Curriculum syllabus loaded", meta=meta)

# ==============================================================================
# 6. D-WALLET & VERIFIED DOCUMENTS (Supabase student_documents)
# ==============================================================================
@router.get("/documents", tags=["D-Wallet"])
@router.get("/dwallet", tags=["D-Wallet"])
def get_dwallet_documents(
    student_code: str = Query("308637"),
    db: Session = Depends(get_db)
):
    """Lists verified institutional documents from Supabase student_documents."""
    data, meta = supabase_service.get_documents(student_code=student_code, db=db)
    return success_response(data=data, message="Documents retrieved from D-Wallet", meta=meta)

@router.post("/documents/upload", tags=["D-Wallet"])
@router.post("/dwallet/upload", tags=["D-Wallet"])
def upload_dwallet_document(
    payload: DocumentUpload,
    student_code: str = Query("308637"),
    db: Session = Depends(get_db)
):
    """Registers an uploaded document in Supabase student_documents with verification."""
    success, msg = supabase_service.upload_document(
        student_code=student_code,
        doc_data=payload.model_dump(),
        db=db
    )
    return success_response(message=msg, code=201)

# ==============================================================================
# 7. NOTIFICATIONS & ANNOUNCEMENTS (Supabase student_notifications)
# ==============================================================================
@router.get("/notifications", tags=["Notifications"])
def get_notifications(
    student_code: str = Query("308637"),
    db: Session = Depends(get_db)
):
    """Returns official announcements and notifications with read status and severity."""
    data, meta = supabase_service.get_notifications(student_code=student_code, db=db)
    return success_response(data=data, message="Notifications fetched", meta=meta)

@router.patch("/notifications/{notification_id}/read", tags=["Notifications"])
@router.post("/notifications/{notification_id}/read", tags=["Notifications"])
def mark_notification_read(
    notification_id: str = Path(..., description="Notification UUID or ID"),
    db: Session = Depends(get_db)
):
    """Marks a notification as read across Supabase and local cache."""
    success, msg = supabase_service.mark_notification_read(notification_id=notification_id, db=db)
    return success_response(message=msg)

# ==============================================================================
# 8. FEES & ACCOUNTS
# ==============================================================================
@router.get("/fees", tags=["Finance"])
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

@router.post("/fees/pay", tags=["Finance"])
def initiate_online_payment(payload: FeePaymentIntent):
    import uuid
    order_id = f"ORD-SSGMCE-{str(uuid.uuid4())[:8].upper()}"
    return success_response(data={
        "paymentGateway": "SBI ePay / Razorpay Enterprise",
        "orderId": order_id,
        "amount": payload.amount,
        "status": "INITIATED",
        "message": "Payment gateway checkout session initiated successfully"
    })

# ==============================================================================
# 9. E-LEARNING (ASSIGNMENTS, E-CONTENT, QUIZZES)
# ==============================================================================
@router.get("/elearning", tags=["E-Learning"])
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
# 10. CHANGE INFORMATION REQUESTS
# ==============================================================================
@router.get("/change-info", tags=["Student Office"])
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

@router.post("/change-info", tags=["Student Office"])
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

    return success_response(
        data={"requestId": req.id},
        message="Change request submitted to Dean Office for verification",
        code=201
    )

# ==============================================================================
# 11. UPDATION OF INFORMATION (ACTIVITIES / AICTE 100 POINTS)
# ==============================================================================
@router.get("/update-info", tags=["Student Office"])
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

@router.post("/update-info", tags=["Student Office"])
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
# 12. EXAMINATION CELL
# ==============================================================================
@router.get("/examination", tags=["Examination"])
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

@router.post("/examination/revaluation", tags=["Examination"])
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
