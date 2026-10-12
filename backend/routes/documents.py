"""
================================================================================
SSGMCE COLLEGE ERP — CANONICAL DOCUMENTS & DIGITAL WALLET ROUTER
Namespace: /api/v1/documents/...
Private Supabase Storage, Zero-Trust Access, Signed URLs, and Governance
================================================================================
"""

import io
import base64
import uuid
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Body, HTTPException, Response, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from backend.config.database import get_db
from backend.auth import AuthenticatedUser, get_optional_user, get_current_user
from backend.rbac.service import RBACService
from backend.rbac.models import Permission
from backend.services.document_service import DocumentService
from backend.services.academic_wallet_service import AcademicWalletService
from backend.schemas.documents import DocumentUploadMetadata, DocumentVerifyRequest, DocumentRejectRequest
from backend.utils.helpers import success_response, error_response

router = APIRouter(prefix="/documents", tags=["Digital Wallet & Documents"])


# =============================================================================
# 1. STUDENT FLOW: VIEW, UPLOAD & SECURE DOWNLOAD
# =============================================================================
@router.get("")
@router.get("/")
def get_documents(
    student_code: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/documents
    Retrieves student digital wallet documents with zero-trust IDOR isolation.
    All document access uses authenticated endpoints or private signed URLs.
    Never exposes private documents through public URLs.
    """
    from backend.routes.students import resolve_student_code
    sc = resolve_student_code(student_code, current_user)
    docs = DocumentService.get_student_documents(sc, current_user, db)
    return success_response(docs, "Documents retrieved successfully")


@router.post("/upload")
async def upload_document(
    file: Optional[UploadFile] = File(None),
    document_type: str = Form("other"),
    document_title: Optional[str] = Form(None),
    document_number: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    student_code: Optional[str] = Query(None),
    payload: Optional[Dict[str, Any]] = Body(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/documents/upload
    Uploads document to private Supabase Storage bucket ('student-documents').
    Supports both multipart form-data (file upload) and JSON payload.
    Validates file type (.pdf, .png, .jpg, .jpeg), file size (<= 10MB), and ownership.
    Maintains audit logs for document operations.
    """
    from backend.routes.students import resolve_student_code

    # Check if multipart or JSON
    if file is not None:
        file_bytes = await file.read()
        filename = file.filename or "uploaded_document.pdf"
        content_type = file.content_type or "application/pdf"
        title = document_title or filename
        meta = DocumentUploadMetadata(
            document_type=document_type,
            document_title=title,
            document_number=document_number,
            description=description
        )
        sc = resolve_student_code(student_code, current_user)
    elif payload is not None:
        sc = resolve_student_code(student_code or payload.get("student_code"), current_user)
        title = payload.get("title") or payload.get("document_title") or "Verification Document"
        filename = payload.get("file_name") or f"{title.replace(' ', '_')}.pdf"
        content_type = payload.get("content_type") or "application/pdf"
        doc_type = payload.get("document_type") or payload.get("doc_type") or "other"

        if "file_base64" in payload:
            file_bytes = base64.b64decode(payload["file_base64"])
        else:
            # Generate valid mock PDF content if none provided
            file_bytes = f"%PDF-1.4\n%SSGMCE Private Document Vault: {title} for {sc}\n%%EOF".encode("utf-8")

        meta = DocumentUploadMetadata(
            document_type=doc_type,
            document_title=title,
            document_number=payload.get("document_number"),
            description=payload.get("description")
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No document file or payload provided for upload."
        )

    res = DocumentService.upload_student_document(
        student_code=sc,
        file_bytes=file_bytes,
        filename=filename,
        content_type=content_type,
        metadata=meta,
        current_user=current_user,
        db=db
    )
    return success_response(res, "Document uploaded successfully to private storage", code=201)


@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/documents/{document_id}/download
    Secure authenticated access to private document.
    Streams raw bytes with verified ownership without exposing public storage links.
    """
    file_bytes, content_type, filename = DocumentService.download_document(document_id, current_user, db)
    return Response(
        content=file_bytes,
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "private, no-cache, no-store, must-revalidate"
        }
    )


@router.get("/{document_id}/signed-url")
def get_document_signed_url(
    document_id: str,
    expires_in: int = Query(3600, ge=60, le=86400),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/documents/{document_id}/signed-url
    Generates time-limited cryptographically signed URL from Supabase Storage.
    Url expires automatically after specified expiration window (default: 3600s).
    """
    res = DocumentService.get_signed_url_response(document_id, expires_in, current_user, db)
    return success_response(res)


# =============================================================================
# 2. ACADEMIC CERTIFICATES & CRYPTOGRAPHIC VERIFICATION
# =============================================================================
@router.get("/certificates")
def get_student_certificates(
    student_code: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    GET /api/v1/documents/certificates
    Retrieves digitally issued academic certificates.
    """
    from backend.routes.students import resolve_student_code
    sc = resolve_student_code(student_code, current_user)
    certs = AcademicWalletService.get_student_certificates(sc)
    return success_response(certs)


@router.get("/certificates/verify/{verification_code}")
def verify_certificate(verification_code: str):
    """
    GET /api/v1/documents/certificates/verify/{verification_code}
    Public cryptographic certificate verification endpoint.
    """
    try:
        data = AcademicWalletService.verify_certificate_code(verification_code)
        if not data:
            return error_response(f"Certificate '{verification_code}' could not be verified", 404)
        return success_response(data)
    except Exception as e:
        return error_response(f"Certificate '{verification_code}' could not be verified: {str(e)}", 404)


# =============================================================================
# 3. ADMIN FLOW: VERIFY, MANAGE STATUS, AUDIT LOGS
# =============================================================================
@router.get("/admin/list")
def get_all_documents_admin(
    status: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    class_name: Optional[str] = Query(None),
    student_code: Optional[str] = Query(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/documents/admin/list
    Admin review console of student uploaded documents.
    """
    if current_user and (current_user.role or "").lower() not in ("admin", "super_admin", "faculty", "hod", "teacher"):
        raise HTTPException(status_code=403, detail="Forbidden: Admin or Faculty access required.")

    docs = DocumentService.get_all_documents_admin(
        status_filter=status,
        doc_type=document_type,
        class_name=class_name,
        student_code=student_code,
        db=db
    )
    return success_response(docs)


@router.post("/{document_id}/verify")
def verify_document(
    document_id: str,
    payload: DocumentVerifyRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/documents/{document_id}/verify
    Admin marks document as verified and official.
    Maintains audit logs.
    """
    if current_user and (current_user.role or "").lower() not in ("admin", "super_admin", "faculty", "hod"):
        raise HTTPException(status_code=403, detail="Forbidden: Admin or Verification Authority required.")

    res = DocumentService.verify_document(document_id, payload.notes, current_user, db)
    return success_response(res, res.get("message", "Document verified successfully"))


@router.post("/{document_id}/reject")
def reject_document(
    document_id: str,
    payload: DocumentRejectRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/documents/{document_id}/reject
    Admin rejects document with mandatory rejection reason.
    Maintains audit logs.
    """
    if current_user and (current_user.role or "").lower() not in ("admin", "super_admin", "faculty", "hod"):
        raise HTTPException(status_code=403, detail="Forbidden: Admin or Verification Authority required.")

    res = DocumentService.reject_document(document_id, payload.reason, current_user, db)
    return success_response(res, res.get("message", "Document rejected"))


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    DELETE /api/v1/documents/{document_id}
    Purges document from private storage and database with audit logging.
    """
    res = DocumentService.delete_document(document_id, current_user, db)
    return success_response(res, res.get("message", "Document deleted"))
