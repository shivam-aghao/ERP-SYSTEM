"""
================================================================================
SSGMCE COLLEGE ERP — DIGITAL DOCUMENT WALLET SCHEMAS
================================================================================
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


class DocumentUploadMetadata(BaseModel):
    document_type: str = Field(..., description="Document type: aadhar_card, income_certificate, caste_certificate, domicile_certificate, marksheet, bonafide, transfer_certificate, fee_receipt_upload, other")
    document_title: str = Field(..., min_length=2, max_length=150, description="Document display title")
    document_number: Optional[str] = Field(None, max_length=100, description="Official identification number")
    description: Optional[str] = Field(None, max_length=500, description="Optional notes")
    issue_date: Optional[str] = Field(None, description="Issuance date (YYYY-MM-DD)")

    @field_validator("document_type")
    @classmethod
    def validate_doc_type(cls, v: str) -> str:
        clean = (v or "").strip().lower().replace(" ", "_")
        allowed = {
            "aadhar", "aadhar_card", "income_certificate", "caste_certificate",
            "domicile_certificate", "marksheet", "bonafide", "transfer_certificate",
            "leaving_certificate", "migration_certificate", "internship_certificate",
            "fee_receipt_upload", "other", "id_proof", "id_card", "pan", "pan_card", "academic"
        }
        if clean not in allowed:
            return "other"
        return clean


class DocumentVerifyRequest(BaseModel):
    notes: Optional[str] = Field("Verified and approved by administration", description="Verification notes")


class DocumentRejectRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Mandatory document rejection justification")
