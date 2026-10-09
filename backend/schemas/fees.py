"""
================================================================================
SSGMCE COLLEGE ERP — FEE WALLET & FINANCIAL SCHEMAS
================================================================================
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


class FeePaymentRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Payment amount must be greater than zero")
    payment_method: str = Field("upi", description="Payment method: upi, net_banking, card, cash, cheque, dd")
    invoice_id: Optional[str] = Field(None, description="Target invoice UUID")
    payment_reference: Optional[str] = Field(None, description="External reference number")
    student_code: Optional[str] = Field(None, description="Student identification code")

    @field_validator("payment_method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        clean = (v or "").strip().lower()
        allowed = {"upi", "net_banking", "card", "cash", "cheque", "dd", "bank_transfer", "online_upi"}
        if clean not in allowed:
            return "upi"
        return clean


class CreateFeeInvoiceRequest(BaseModel):
    student_code: str = Field(..., min_length=3, description="Student registration code")
    academic_year: Optional[str] = Field("2026-27", description="Academic year")
    semester: Optional[int] = Field(5, ge=1, le=8, description="Semester number")
    subtotal: float = Field(..., gt=0, description="Gross tuition/fees amount")
    scholarship_amount: Optional[float] = Field(0.0, ge=0, description="Government or merit scholarship deduction")
    discount_amount: Optional[float] = Field(0.0, ge=0, description="Fee concession or discount")
    due_date: Optional[str] = Field(None, description="Due date (YYYY-MM-DD)")
    items: Optional[List[Dict[str, Any]]] = Field(None, description="Itemized fee breakdown components")


class RecordFeePaymentRequest(BaseModel):
    student_code: str = Field(..., min_length=3, description="Student registration code")
    amount: float = Field(..., gt=0, description="Recorded payment amount")
    payment_method: str = Field("cash", description="Payment method: cash, cheque, dd, bank_transfer, upi")
    payment_reference: Optional[str] = Field(None, description="Instrument / transaction reference")
    invoice_id: Optional[str] = Field(None, description="Target invoice UUID")
    remarks: Optional[str] = Field(None, description="Bursar remarks")


class FeeInvoiceUpdateRequest(BaseModel):
    status: Optional[str] = Field(None, description="Invoice status: pending, partial, paid, overdue, cancelled")
    paid_amount: Optional[float] = Field(None, ge=0)
    concession_amount: Optional[float] = Field(None, ge=0)
    remarks: Optional[str] = Field(None)
