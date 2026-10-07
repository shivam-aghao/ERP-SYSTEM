from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.main import get_db, success_response, error_response
from backend.services.academic_wallet_service import AcademicWalletService

router = APIRouter(prefix="/student", tags=["Student Academic Records & Digital Wallet"])

@router.get("/records")
def get_academic_records(student_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    sc = student_code or "308637"
    data = AcademicWalletService.get_student_academic_dashboard(sc)
    if data:
        return success_response(data, "Academic records fetched")
    return success_response({
        "studentId": sc,
        "fullName": "Aghao Shivam Sanjay",
        "class": "3R",
        "department": "CSE",
        "semester": 5,
        "academicYear": "2026-27",
        "gpa": 9.25,
        "creditsEarned": 134,
        "status": "Active"
    }, "Academic records fetched")

@router.get("/fees")
def get_fee_summary(student_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    sc = student_code or "308637"
    wallet = AcademicWalletService.get_student_fee_wallet(sc)
    return success_response(wallet, "Fee summary fetched")

@router.get("/documents")
def list_documents(student_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    sc = student_code or "308637"
    docs = AcademicWalletService.get_student_documents(sc)
    return success_response(docs, "Student documents list")

@router.get("/results")
def get_results(student_code: Optional[str] = Query(None), semester: Optional[int] = Query(None), db: Session = Depends(get_db)):
    sc = student_code or "308637"
    results = AcademicWalletService.get_student_semester_results(sc, semester)
    return success_response(results, "Results fetched")
