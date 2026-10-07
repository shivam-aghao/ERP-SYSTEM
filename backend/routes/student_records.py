from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.main import get_db, success_response, error_response

router = APIRouter(prefix="/api/v1/student", tags=["Student Academic Records"])

# Dummy static data – in a real system this would be queried from DB / external services
DUMMY_RECORDS = {
    "studentId": "312225E015",
    "fullName": "Rahul Sharma",
    "class": "3R",
    "department": "CSE",
    "semester": 5,
    "academicYear": "2026-27",
    "gpa": 8.7,
    "creditsEarned": 120,
    "status": "Active"
}

DUMMY_FEES = {
    "studentId": "312225E015",
    "totalDue": 15000.0,
    "paid": 9000.0,
    "outstanding": 6000.0,
    "dueDate": "2026-12-31",
    "breakdown": [
        {"item": "Tuition", "amount": 8000},
        {"item": "Lab", "amount": 2000},
        {"item": "Library", "amount": 1500},
        {"item": "Misc", "amount": 5000}
    ]
}

DUMMY_DOCS = [
    {"id": "doc-001", "title": "Admission Letter", "url": "/static/docs/admission.pdf"},
    {"id": "doc-002", "title": "Previous Transcript", "url": "/static/docs/transcript.pdf"},
    {"id": "doc-003", "title": "ID Card", "url": "/static/docs/idcard.pdf"}
]

DUMMY_RESULTS = {
    "studentId": "312225E015",
    "results": [
        {"semester": 3, "gpa": 8.2, "status": "Pass"},
        {"semester": 4, "gpa": 8.5, "status": "Pass"},
        {"semester": 5, "gpa": 8.7, "status": "Pass"}
    ],
    "cumulativeGPA": 8.47
}

@router.get("/records")
def get_academic_records(db: Session = Depends(get_db)):
    # In production fetch from DB; here return dummy
    return success_response(DUMMY_RECORDS, "Academic records fetched")

@router.get("/fees")
def get_fee_summary(db: Session = Depends(get_db)):
    return success_response(DUMMY_FEES, "Fee summary fetched")

@router.get("/documents")
def list_documents(db: Session = Depends(get_db)):
    return success_response(DUMMY_DOCS, "Student documents list")

@router.get("/results")
def get_results(db: Session = Depends(get_db)):
    return success_response(DUMMY_RESULTS, "Results fetched")

