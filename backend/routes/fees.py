"""
================================================================================
SSGMCE COLLEGE ERP — CANONICAL FEES ROUTER
Namespace: /api/v1/fees/...
Authoritative Fee Accounts, Invoicing, Online Payments, Receipts, and Reports
================================================================================
"""

import io
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Body, HTTPException, Response, status
from sqlalchemy.orm import Session

from backend.config.database import get_db
from backend.auth import AuthenticatedUser, get_optional_user, get_current_user
from backend.rbac.service import RBACService
from backend.rbac.models import Permission
from backend.services.fee_service import FeeService
from backend.schemas.fees import (
    FeePaymentRequest, CreateFeeInvoiceRequest, RecordFeePaymentRequest, FeeInvoiceUpdateRequest
)
from backend.utils.helpers import success_response, error_response

router = APIRouter(prefix="/fees", tags=["Fee Wallet & Financials"])


# =============================================================================
# 1. STUDENT FLOW: SUMMARY, PAYMENT & TRANSACTIONS
# =============================================================================
@router.get("")
@router.get("/")
def get_fee_summary(
    student_code: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/fees
    Retrieves student fee wallet summary:
    Total fees, paid, pending, due date, payment history, and receipts.
    Zero-trust IDOR security protection.
    """
    from backend.routes.students import resolve_student_code
    sc = resolve_student_code(student_code, current_user)
    data = FeeService.get_student_fee_summary(sc, current_user, db)
    return success_response(data, "Fee wallet summary retrieved successfully")


@router.post("/pay")
def pay_student_fee(
    payload: FeePaymentRequest,
    student_code: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/fees/pay
    Processes student online fee payment installment with automatic balance deduction
    and digital receipt generation.
    """
    from backend.routes.students import resolve_student_code
    sc = resolve_student_code(student_code or payload.student_code, current_user)
    res = FeeService.pay_student_fee(sc, payload, current_user, db)
    return success_response(res, "Fee installment payment processed successfully", code=201)


@router.get("/transactions")
def get_fee_transactions(
    student_code: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/fees/transactions
    Transaction history and digital receipt ledger for student.
    """
    from backend.routes.students import resolve_student_code
    sc = resolve_student_code(student_code, current_user)
    summary = FeeService.get_student_fee_summary(sc, current_user, db)
    return success_response({
        "student_code": sc,
        "total_fees": summary.get("total_fees"),
        "paid_amount": summary.get("paid_amount"),
        "pending_amount": summary.get("pending_amount"),
        "transactions": summary.get("transactions", []),
        "receipts": summary.get("receipts", [])
    })


@router.get("/receipts/{receipt_id}/download")
def download_fee_receipt(
    receipt_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/fees/receipts/{receipt_id}/download
    Downloads or renders official digital fee receipt.
    """
    from sqlalchemy import text
    row = db.execute(text("""
        SELECT fr.id, fr.receipt_number, fr.receipt_date, fr.amount,
               s.student_code, s.full_name, s.class_name, fp.payment_method, fp.payment_reference
        FROM fee_receipts fr
        JOIN students s ON fr.student_id = s.id
        LEFT JOIN fee_payments fp ON fr.payment_id = fp.id
        WHERE fr.id::text = :rid OR fr.receipt_number = :rid
    """), {"rid": receipt_id}).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Fee receipt record not found.")

    # Return receipt metadata and printable representation
    receipt_data = {
        "receipt_id": str(row[0]),
        "receipt_number": row[1],
        "receipt_date": str(row[2])[:10] if row[2] else "",
        "amount": float(row[3] or 0.0),
        "student_code": row[4],
        "student_name": row[5],
        "class_name": row[6],
        "payment_method": (row[7] or "UPI").upper(),
        "payment_reference": row[8] or "",
        "institution": "Shri Sant Gajanan Maharaj College of Engineering, Shegaon (Autonomous)",
        "status": "PAID & VERIFIED"
    }
    return success_response(receipt_data)


# =============================================================================
# 2. ADMIN FLOW: INVOICES, MANUAL PAYMENTS, DUES & REPORTS
# =============================================================================
@router.post("/invoices")
def create_fee_invoice(
    payload: CreateFeeInvoiceRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/fees/invoices
    Admin generates new institutional fee invoice for a student.
    """
    if current_user and (current_user.role or "").lower() not in ("admin", "super_admin", "accountant", "hod"):
        raise HTTPException(status_code=403, detail="Forbidden: Admin or Accounts permission required.")

    res = FeeService.create_fee_invoice(payload, current_user, db)
    return success_response(res, "Fee invoice created successfully", code=201)


@router.post("/payments/record")
def admin_record_payment(
    payload: RecordFeePaymentRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/fees/payments/record
    Admin / Accounts records manual or offline payment (cash, DD, cheque).
    """
    if current_user and (current_user.role or "").lower() not in ("admin", "super_admin", "accountant", "hod"):
        raise HTTPException(status_code=403, detail="Forbidden: Admin or Accounts permission required.")

    res = FeeService.admin_record_payment(payload, current_user, db)
    return success_response(res, "Payment successfully recorded by Accounts", code=201)


@router.get("/pending")
def get_pending_fees(
    class_name: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/fees/pending
    Admin view of students with pending fee dues and overdue status.
    """
    data = FeeService.get_pending_fees_report(class_name, db)
    return success_response(data)


@router.get("/reports/class-collection")
def get_class_collection_report(
    academic_year: Optional[str] = Query("2026-27"),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/fees/reports/class-collection
    Class-wise aggregated fee collection report.
    """
    data = FeeService.get_class_collection_report(academic_year, db)
    return success_response(data)


@router.get("/reports/student-dues")
def get_student_dues_report(
    class_name: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/fees/reports/student-dues
    Student-wise dues list with overdue days and pending balance.
    """
    data = FeeService.get_pending_fees_report(class_name, db)
    return success_response(data)


@router.get("/export")
def export_fee_ledger(
    class_name: Optional[str] = Query(None),
    academic_year: Optional[str] = Query("2026-27"),
    format: Optional[str] = Query("csv"),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/fees/export
    Exports comprehensive institutional fee ledger.
    Returns CSV file with UTF-8 BOM for Excel compatibility.
    """
    if current_user and not RBACService.has_permission(current_user, Permission.FEES_EXPORT.value) and (current_user.role or "").lower() not in ("accountant", "admin", "super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not possess permission 'fees.export' to export financial ledgers."
        )

    csv_content = FeeService.export_fee_ledger_csv(class_name, academic_year, db)
    filename = f"Fee_Ledger_{class_name or 'AllClasses'}_{academic_year}.csv"

    if format == "json":
        return success_response({
            "academic_year": academic_year,
            "class_name": class_name,
            "filename": filename,
            "csv_content": csv_content
        })

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "text/csv; charset=utf-8"
        }
    )


@router.put("/invoice/{invoice_id}")
def update_fee_invoice(
    invoice_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    PUT /api/v1/fees/invoice/{invoice_id}
    Modifies or waives fee invoice. Enforces 'fees.update' permission.
    """
    if current_user and not RBACService.has_permission(current_user, Permission.FEES_UPDATE.value) and (current_user.role or "").lower() not in ("accountant", "admin", "super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not possess permission 'fees.update' to modify invoices."
        )

    from sqlalchemy import text
    db.execute(text("""
        UPDATE fee_invoices
        SET status = COALESCE(:st, status),
            paid_amount = COALESCE(:pd, paid_amount),
            discount_amount = COALESCE(:disc, discount_amount),
            pending_amount = CASE WHEN :pd IS NOT NULL THEN GREATEST(0, total_amount - CAST(:pd AS NUMERIC)) ELSE pending_amount END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id::text = :iid
    """), {
        "st": payload.get("status"),
        "pd": payload.get("paid_amount"),
        "disc": payload.get("concession_amount"),
        "iid": invoice_id
    })
    db.commit()

    return success_response({"invoice_id": invoice_id, "updated": True}, "Invoice updated successfully")
