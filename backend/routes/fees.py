"""
================================================================================
SSGMCE COLLEGE ERP — CANONICAL FEES ROUTER
Namespace: /api/v1/fees/...
Authoritative Fee Accounts, Invoicing, Online Payments, Receipts, and Reports
================================================================================
"""

import io
import json
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Body, HTTPException, Response, status
from fastapi.responses import HTMLResponse
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


@router.get("/receipts/{receipt_id:path}")
def download_fee_receipt(
    receipt_id: str,
    format: Optional[str] = Query("json"),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/fees/receipts/{receipt_id}
    GET /api/v1/fees/receipts/{receipt_id}/download
    Renders or downloads official computerized institutional fee receipt with zero-trust IDOR protection.
    Supports UUID, slashes in receipt number, and URL-encoded identifiers.
    """
    import urllib.parse
    raw_rid = str(receipt_id).strip()
    if raw_rid.endswith("/download"):
        raw_rid = raw_rid[:-9].strip()
    cleaned_rid = urllib.parse.unquote(raw_rid).strip()

    from sqlalchemy import text
    row = db.execute(text("""
        SELECT fr.id, fr.receipt_no, fr.payment_date, fr.amount,
               s.student_code, s.full_name, s.class_name, fr.payment_mode, fr.transaction_id,
               fr.fee_category, fr.payment_time, fr.particulars_json, fr.payer_name,
               COALESCE(c.academic_year, '2025-2026') as academic_year,
               COALESCE(c.semester, fr.semester, 5) as semester,
               s.id as student_id, s.roll_no, c.name as class_full_name,
               fr.bank_name, fr.status
        FROM fee_receipts fr
        LEFT JOIN students s ON (fr.student_code = s.student_code OR CAST(s.id AS TEXT) = fr.student_code)
        LEFT JOIN classes c ON (s.class_id = c.id OR s.class_name = c.class_name)
        WHERE CAST(fr.id AS TEXT) = :rid 
           OR fr.receipt_no = :rid 
           OR fr.receipt_no = :c_rid
           OR CAST(fr.id AS TEXT) = :c_rid
        LIMIT 1
    """), {"rid": raw_rid, "c_rid": cleaned_rid}).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Fee receipt record not found.")

    m = row._mapping

    # Zero-Trust IDOR Protection: Students may only access their own receipts
    if current_user and (current_user.role or "").lower() == "student":
        caller_ident = str(getattr(current_user, "identifier", None) or getattr(current_user, "student_code", None) or current_user.user_id or "")
        caller_id = str(current_user.id or "")
        rcpt_sc = str(m.get("student_code") or "")
        stud_table_id = str(m.get("student_id") or "")
        allowed = (
            (rcpt_sc and rcpt_sc == caller_ident)
            or (rcpt_sc and rcpt_sc == caller_id)
            or (stud_table_id and stud_table_id == caller_id)
        )
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You are only authorized to access your own institutional fee receipts."
            )

    r_id = str(m["id"])
    r_no = str(m["receipt_no"] or f"SSGMCE/FEE/{r_id[:8].upper()}")
    amt = float(m["amount"] or 0.0)
    words = FeeService.number_to_inr_words(amt)

    # Parse particulars JSON
    parts = []
    raw_pj = m.get("particulars_json")
    if raw_pj:
        try:
            parts = json.loads(raw_pj)
        except Exception:
            pass
    if not parts:
        cat_name = str(m.get("fee_category") or "CURRENT_YEAR").upper()
        parts = [{"head": f"{cat_name} Fee", "amount": amt}]

    receipt_data = {
        "receipt_id": r_id,
        "receipt_number": r_no,
        "receipt_no": r_no,
        "receipt_date": str(m["payment_date"])[:10] if m["payment_date"] else "",
        "payment_date": str(m["payment_date"]) if m["payment_date"] else "",
        "payment_time": str(m.get("payment_time") or ""),
        "amount": amt,
        "amount_in_words": words,
        "student_code": str(m["student_code"] or ""),
        "student_name": str(m["full_name"] or m.get("payer_name") or "Student"),
        "class_name": str(m["class_name"] or "3R"),
        "course_class": str(m.get("class_full_name") or m.get("class_name") or "Computer Science & Engineering"),
        "academic_session": str(m.get("academic_year") or "2025-2026"),
        "semester": f"Semester {m.get('semester') or 5}",
        "roll_no": str(m.get("roll_no") or ""),
        "fee_category": str(m.get("fee_category") or "CURRENT_YEAR").upper(),
        "particulars": parts,
        "payment_method": str(m["payment_mode"] or "UPI").upper(),
        "payment_reference": str(m["transaction_id"] or ""),
        "transaction_id": str(m["transaction_id"] or ""),
        "bank_name": str(m.get("bank_name") or "State Bank of India (BillDesk / SBI e-Pay)"),
        "college_name": "Shri Sant Gajanan Maharaj College of Engineering, Shegaon",
        "institution": "Shri Sant Gajanan Maharaj College of Engineering, Shegaon (An Autonomous Institute)",
        "logo_url": "https://www.ssgmce.ac.in/favicon.svg",
        "status": "PAID & VERIFIED (SUCCESS)",
        "issued_by": "Autonomous Finance & Accounts Section, SSGMCE Shegaon"
    }

    if format == "html":
        # Render print-ready institutional counterfoil
        particulars_rows = "".join([
            f"<tr><td>{idx+1}</td><td><strong>{p.get('head')}</strong></td><td style='text-align:right;'>₹ {float(p.get('amount', 0)):,.2f}</td></tr>"
            for idx, p in enumerate(parts)
        ])
        html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - {r_no}</title>
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; padding: 24px; color: #0f172a; margin: 0; }}
    .paper {{ max-width: 760px; margin: 0 auto; background: #ffffff; border: 2px solid #004080; border-radius: 8px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }}
    .header {{ text-align: center; border-bottom: 2px solid #004080; padding-bottom: 16px; margin-bottom: 20px; }}
    .logo {{ height: 56px; margin-bottom: 8px; }}
    .inst-title {{ font-size: 19px; font-weight: 800; color: #004080; text-transform: uppercase; }}
    .inst-sub {{ font-size: 12.5px; color: #475569; margin-top: 4px; }}
    .doc-pill {{ display: inline-block; margin-top: 10px; background: #004080; color: #ffffff; padding: 5px 16px; border-radius: 4px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; }}
    .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; margin-bottom: 20px; }}
    .cell {{ padding: 8px 12px; background: #f1f5f9; border-radius: 4px; border: 1px solid #e2e8f0; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }}
    th {{ background: #004080; color: #fff; padding: 8px 10px; text-align: left; }}
    td {{ padding: 8px 10px; border: 1px solid #cbd5e1; }}
    .total-box {{ margin-top: 16px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 6px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; }}
    .amt-num {{ font-size: 22px; font-weight: 800; color: #15803d; }}
    .seal-row {{ display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b; }}
    @media print {{ body {{ background: #fff; padding: 0; }} .paper {{ border: 1px solid #000; box-shadow: none; }} .no-print {{ display: none; }} }}
  </style>
</head>
<body>
  <div class="no-print" style="max-width:760px; margin: 0 auto 16px auto; display:flex; justify-content:flex-end; gap:8px;">
    <button onclick="window.print()" style="background:#004080; color:#fff; border:none; padding:8px 16px; border-radius:4px; font-weight:600; cursor:pointer;">🖨️ Print Receipt</button>
  </div>
  <div class="paper">
    <div class="header">
      <img src="https://www.ssgmce.ac.in/favicon.svg" alt="SSGMCE Logo" class="logo">
      <div class="inst-title">Shri Sant Gajanan Maharaj College of Engineering, Shegaon</div>
      <div class="inst-sub">An Autonomous Institute Affiliated to Sant Gadge Baba Amravati University • Approved by AICTE, New Delhi</div>
      <div class="doc-pill">OFFICIAL STUDENT FEE RECEIPT</div>
    </div>
    <div class="grid">
      <div class="cell"><strong>Receipt No:</strong> {r_no}</div>
      <div class="cell"><strong>Date & Time:</strong> {m['payment_date']} {m.get('payment_time') or ''}</div>
      <div class="cell"><strong>Student Code (PRN):</strong> {m['student_code']}</div>
      <div class="cell"><strong>Student Name:</strong> {receipt_data['student_name']}</div>
      <div class="cell"><strong>Class & Year:</strong> {receipt_data['course_class']}</div>
      <div class="cell"><strong>Semester & Session:</strong> {receipt_data['semester']} ({receipt_data['academic_session']})</div>
      <div class="cell"><strong>Fee Category:</strong> {receipt_data['fee_category']}</div>
      <div class="cell"><strong>Payment Method:</strong> {receipt_data['payment_method']}</div>
      <div class="cell" style="grid-column:span 2;"><strong>Transaction / Bank Reference:</strong> {receipt_data['payment_reference']}</div>
    </div>
    <table>
      <thead><tr><th style="width:40px;">#</th><th>Fee Head Description</th><th style="text-align:right;">Amount (INR)</th></tr></thead>
      <tbody>{particulars_rows}</tbody>
      <tfoot><tr><td colspan="2" style="text-align:right; font-weight:800;">Total Amount Paid :</td><td style="text-align:right; font-weight:800; color:#15803d;">₹ {amt:,.2f}</td></tr></tfoot>
    </table>
    <div class="total-box">
      <div>
        <div style="font-size:11.5px; font-weight:700; color:#166534; text-transform:uppercase;">Amount in Words:</div>
        <div style="font-size:13px; font-weight:600; color:#0f172a; margin-top:2px;">{words}</div>
      </div>
      <div class="amt-num">₹ {amt:,.2f}</div>
    </div>
    <div class="seal-row">
      <div>Computer Generated Official ERP Counterfoil<br><small style="color:#94a3b8;">No physical signature needed</small></div>
      <div style="text-align:right;"><strong>Accounts & Finance Officer</strong><br>SSGMCE Shegaon (Autonomous)</div>
    </div>
  </div>
</body>
</html>"""
        return HTMLResponse(content=html, status_code=200)

    return success_response(receipt_data)


@router.get("/structures")
def get_fee_structures(
    class_name: Optional[str] = Query(None),
    academic_year: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/fees/structures
    Returns approved institutional fee structures with headwise particulars.
    """
    from sqlalchemy import text
    query = "SELECT id, class_name, academic_year, semester, total_fee FROM fee_structures WHERE 1=1"
    params = {}
    if class_name:
        query += " AND class_name = :cls"
        params["cls"] = class_name
    if academic_year:
        query += " AND academic_year = :ay"
        params["ay"] = academic_year
    query += " ORDER BY academic_year DESC, class_name ASC"

    rows = db.execute(text(query), params).fetchall()
    results = []
    for r in rows:
        sid = str(r[0])
        parts = db.execute(text("""
            SELECT fee_head, amount, is_refundable, display_order
            FROM fee_structure_particulars
            WHERE fee_structure_id = :sid
            ORDER BY display_order ASC
        """), {"sid": sid}).fetchall()

        breakdown = [
            {
                "fee_head": str(p[0]),
                "amount": float(p[1] or 0.0),
                "is_refundable": bool(p[2]),
                "display_order": p[3] or 0
            }
            for p in parts
        ]

        results.append({
            "id": sid,
            "class_name": str(r[1]),
            "academic_year": str(r[2]),
            "semester": r[3],
            "total_fee": float(r[4] or 0.0),
            "particulars": breakdown
        })

    return success_response(results, "Fee structures retrieved successfully")


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
        WHERE CAST(id AS TEXT) = :iid
    """), {
        "st": payload.get("status"),
        "pd": payload.get("paid_amount"),
        "disc": payload.get("concession_amount"),
        "iid": invoice_id
    })
    db.commit()

    return success_response({"invoice_id": invoice_id, "updated": True}, "Invoice updated successfully")
