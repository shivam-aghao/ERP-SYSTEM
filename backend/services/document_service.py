"""
================================================================================
SSGMCE COLLEGE ERP — CANONICAL DIGITAL DOCUMENT WALLET (D-WALLET) SERVICE
Authoritative Private Document Storage, Signed URLs, and Governance
Direct Supabase Private Storage & PostgreSQL Integration
================================================================================
"""

import io
import json
import uuid
import logging
import urllib.parse
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Union, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.config.settings import settings
from backend.auth import AuthenticatedUser
from backend.schemas.documents import DocumentUploadMetadata, DocumentVerifyRequest, DocumentRejectRequest

logger = logging.getLogger("document_service")


class DocumentService:
    BUCKET_NAME = "student-documents"
    ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
    ALLOWED_MIME_TYPES = {
        "application/pdf", "image/png", "image/jpeg", "image/jpg"
    }
    MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

    @classmethod
    def log_audit(
        cls,
        actor_id: Optional[Union[str, uuid.UUID]],
        actor_role: str,
        action: str,
        entity_id: str,
        old_data: Optional[Dict[str, Any]],
        new_data: Optional[Dict[str, Any]],
        reason: Optional[str],
        db: Session
    ):
        """Authoritative immutable document audit trail in admin_audit_logs."""
        try:
            aid_clean = str(actor_id) if actor_id and len(str(actor_id)) == 36 else None
            db.execute(text("""
                INSERT INTO admin_audit_logs (
                    id, actor_id, actor_role, action, module, entity_type, entity_id,
                    old_data, new_data, reason, created_at
                ) VALUES (
                    CAST(:id AS UUID),
                    CASE WHEN :aid IS NOT NULL THEN CAST(:aid AS UUID) ELSE NULL END,
                    :role, :action, 'documents', 'document', :entity_id,
                    CAST(:old_val AS JSONB), CAST(:new_val AS JSONB), :reason, CURRENT_TIMESTAMP
                )
            """), {
                "id": str(uuid.uuid4()),
                "aid": aid_clean,
                "role": actor_role or "system",
                "action": action,
                "entity_id": str(entity_id),
                "old_val": json.dumps(old_data) if old_data else None,
                "new_val": json.dumps(new_data) if new_data else None,
                "reason": reason or ""
            })
            db.commit()
        except Exception as e:
            logger.warning("Document audit logging error: %s", e)

    @classmethod
    def resolve_student(cls, student_code: str, db: Session) -> Dict[str, Any]:
        """Resolves student metadata by code or UUID."""
        sc_clean = str(student_code).strip()
        row = db.execute(text("""
            SELECT id, student_code, full_name, class_name, roll_no
            FROM students
            WHERE student_code = :sc OR id::text = :sc
            LIMIT 1
        """), {"sc": sc_clean}).fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student record not found for '{student_code}'"
            )
        return {
            "id": str(row[0]),
            "student_code": str(row[1]),
            "full_name": str(row[2]),
            "class_name": str(row[3] or "3R"),
            "roll_no": str(row[4] or "")
        }

    # =========================================================================
    # 1. FILE VALIDATION & PRIVATE STORAGE OPERATIONS
    # =========================================================================
    @classmethod
    def validate_file(cls, filename: str, content_type: str, file_bytes: bytes) -> None:
        """
        Validates:
          1. Allowed extensions (.pdf, .png, .jpg, .jpeg)
          2. Allowed MIME type
          3. File size within limits (0 < size <= 10MB)
        """
        if not file_bytes or len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file uploaded. File content cannot be empty."
            )

        if len(file_bytes) > cls.MAX_FILE_SIZE_BYTES:
            size_mb = round(len(file_bytes) / (1024 * 1024), 2)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size ({size_mb} MB) exceeds maximum allowed limit of 10 MB."
            )

        # Check extension
        import os
        ext = os.path.splitext(filename)[1].lower()
        if ext not in cls.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed formats: PDF, PNG, JPG, JPEG."
            )

        # Check content type if supplied
        if content_type and content_type.lower() not in cls.ALLOWED_MIME_TYPES:
            # Also check if it's application/octet-stream but has valid extension
            if content_type.lower() != "application/octet-stream":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported MIME type '{content_type}'. Must be application/pdf or image/png/jpeg."
                )

    @classmethod
    def _upload_to_supabase_storage(cls, storage_path: str, file_bytes: bytes, content_type: str) -> None:
        """Uploads raw binary object to private Supabase Storage bucket."""
        url = f"{settings.SUPABASE_URL}/storage/v1/object/{cls.BUCKET_NAME}/{urllib.parse.quote(storage_path)}"
        req = urllib.request.Request(
            url,
            data=file_bytes,
            headers={
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": content_type or "application/octet-stream",
                "x-upsert": "true"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                if resp.status not in (200, 201):
                    raise RuntimeError(f"Storage upload returned HTTP {resp.status}")
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8") if e.fp else str(e)
            logger.error("Supabase Storage upload error: %s - %s", e.code, err)
            raise HTTPException(status_code=502, detail=f"Storage upload failed: {err}")
        except Exception as e:
            logger.error("Network error uploading to Supabase Storage: %s", e)
            raise HTTPException(status_code=502, detail=f"Storage communication error: {str(e)}")

    @classmethod
    def _create_signed_url(cls, storage_path: str, expires_in: int = 3600) -> str:
        """
        Creates a secure temporary signed URL for private storage object.
        Never exposes private documents through public URLs.
        """
        url = f"{settings.SUPABASE_URL}/storage/v1/object/sign/{cls.BUCKET_NAME}/{storage_path}"
        req_data = json.dumps({"expiresIn": int(expires_in)}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=req_data,
            headers={
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                rel_url = data.get("signedURL")
                return f"{settings.SUPABASE_URL}/storage/v1{rel_url}"
        except Exception as e:
            logger.warning("Error generating signed URL for '%s': %s", storage_path, e)
            # Fallback to local authenticated download proxy route
            return ""

    @classmethod
    def _download_from_supabase_storage(cls, storage_path: str) -> Tuple[bytes, str]:
        """Downloads raw binary object from private Supabase Storage."""
        url = f"{settings.SUPABASE_URL}/storage/v1/object/{cls.BUCKET_NAME}/{urllib.parse.quote(storage_path)}"
        req = urllib.request.Request(
            url,
            headers={
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}"
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                content_type = resp.headers.get("Content-Type", "application/octet-stream")
                return resp.read(), content_type
        except urllib.error.HTTPError as e:
            logger.error("Private document download error [%s]: %s", storage_path, e.code)
            raise HTTPException(status_code=404, detail="Requested file object not found in private storage.")
        except Exception as e:
            logger.error("Storage fetch error: %s", e)
            raise HTTPException(status_code=502, detail="Error fetching file from storage.")

    @classmethod
    def compute_doc_status(cls, db_status: Optional[str], verified: Optional[bool], description: Optional[str] = "") -> str:
        if bool(verified):
            return "verified"
        desc_str = str(description or "")
        st_str = str(db_status or "").lower()
        if st_str == "revoked" or desc_str.startswith("REJECTED:"):
            return "rejected"
        if st_str == "archived":
            return "archived"
        return "pending_verification"

    # =========================================================================
    # 2. STUDENT OPERATIONS: UPLOAD, VIEW OWN, DOWNLOAD OWN
    # =========================================================================
    @classmethod
    def upload_student_document(
        cls,
        student_code: str,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        metadata: DocumentUploadMetadata,
        current_user: Optional[AuthenticatedUser],
        db: Session
    ) -> Dict[str, Any]:
        """
        Uploads student document:
        - Validates file type, size, ownership, authorization.
        - Persists to private Supabase Storage.
        - Records in PostgreSQL student_documents.
        - Maintains audit logs.
        """
        student = cls.resolve_student(student_code, db)
        stud_id = student["id"]
        stud_code = student["student_code"]

        # Ownership validation
        if current_user and (current_user.role or "").lower() == "student":
            caller_code = getattr(current_user, "student_code", None) or current_user.user_id
            if caller_code and caller_code != stud_code and current_user.id != stud_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Students may only upload documents to their own locker."
                )

        # Validate file
        cls.validate_file(filename, content_type, file_bytes)

        # Map document_type to PostgreSQL check constraint values
        pg_allowed_types = {
            'bonafide', 'fee_receipt', 'marksheet', 'admission_receipt',
            'transfer_certificate', 'leaving_certificate', 'migration_certificate',
            'internship_certificate', 'course_completion', 'identity_document', 'other'
        }
        type_aliases = {
            'aadhar': 'identity_document',
            'aadhar_card': 'identity_document',
            'id_card': 'identity_document',
            'id_proof': 'identity_document',
            'identity': 'identity_document',
            'pan': 'identity_document',
            'pan_card': 'identity_document',
            'fee_receipt_upload': 'fee_receipt',
            'academic': 'marksheet',
        }
        clean_type = (metadata.document_type or "other").strip().lower()
        db_dtype = type_aliases.get(clean_type, clean_type if clean_type in pg_allowed_types else 'other')

        # Generate unique private storage path: {student_code}/{type}_{hash}_{clean_filename}
        import re
        clean_name = re.sub(r'[^a-zA-Z0-9_\.-]', '_', filename)
        doc_uuid = str(uuid.uuid4())
        storage_path = f"{stud_code}/{clean_type}_{doc_uuid[:8]}_{clean_name}"

        # Upload to Supabase Storage private bucket
        cls._upload_to_supabase_storage(storage_path, file_bytes, content_type)

        # Insert record into PostgreSQL student_documents
        # Note: status is constrained to ('active', 'archived', 'revoked'), verified is boolean
        db.execute(text("""
            INSERT INTO student_documents (
                id, student_id, document_type, document_title, description,
                file_path, file_name, file_size, mime_type, document_number,
                issue_date, uploaded_by, verified, status, created_at
            ) VALUES (
                CAST(:id AS UUID), CAST(:sid AS UUID), :dtype, :title, :desc,
                :fpath, :fname, :fsize, :mime, :dnum,
                CAST(:idate AS DATE),
                CASE WHEN :ub IS NOT NULL THEN CAST(:ub AS UUID) ELSE NULL END,
                FALSE, 'active', CURRENT_TIMESTAMP
            )
        """), {
            "id": doc_uuid,
            "sid": stud_id,
            "dtype": db_dtype,
            "title": metadata.document_title,
            "desc": metadata.description or "",
            "fpath": storage_path,
            "fname": filename,
            "fsize": len(file_bytes),
            "mime": content_type or "application/pdf",
            "dnum": metadata.document_number,
            "idate": metadata.issue_date,
            "ub": current_user.id if current_user and len(str(current_user.id)) == 36 else None
        })
        db.commit()

        # Audit log
        cls.log_audit(
            actor_id=current_user.id if current_user else None,
            actor_role=current_user.role if current_user else "student",
            action="DOCUMENT_UPLOAD",
            entity_id=doc_uuid,
            old_data=None,
            new_data={
                "document_title": metadata.document_title,
                "document_type": metadata.document_type,
                "file_name": filename,
                "file_size": len(file_bytes),
                "student_code": stud_code
            },
            reason="Student uploaded verification document to private D-Wallet",
            db=db
        )

        signed_url = cls._create_signed_url(storage_path, expires_in=3600)

        return {
            "success": True,
            "id": doc_uuid,
            "document_id": doc_uuid,
            "student_code": stud_code,
            "document_title": metadata.document_title,
            "document_type": metadata.document_type,
            "file_name": filename,
            "file_size": len(file_bytes),
            "status": "pending_verification",
            "verified": False,
            "is_private": True,
            "signed_url": signed_url,
            "download_url": f"/api/v1/documents/{doc_uuid}/download"
        }

    @classmethod
    def get_student_documents(
        cls,
        student_code: str,
        current_user: Optional[AuthenticatedUser],
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        Fetches student's own documents.
        Zero-trust ownership: Students only access own records.
        Never returns public URLs — produces secure signed URLs and download endpoints.
        """
        student = cls.resolve_student(student_code, db)
        stud_id = student["id"]
        stud_code = student["student_code"]

        if current_user and (current_user.role or "").lower() == "student":
            caller_code = getattr(current_user, "student_code", None) or current_user.user_id
            if caller_code and caller_code != stud_code and current_user.id != stud_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Students may only view their own documents."
                )

        rows = db.execute(text("""
            SELECT id, document_type, document_title, description, file_path,
                   file_name, file_size, mime_type, document_number, issue_date,
                   verified, status, created_at
            FROM student_documents
            WHERE student_id = CAST(:sid AS UUID)
            ORDER BY created_at DESC
        """), {"sid": stud_id}).fetchall()

        formatted = []
        for r in rows:
            doc_id = str(r[0])
            fpath = str(r[4])
            size_kb = round(float(r[6] or 150000) / 1024)
            signed_url = cls._create_signed_url(fpath, expires_in=3600)

            formatted.append({
                "id": doc_id,
                "document_id": doc_id,
                "document_title": str(r[2] or "Document"),
                "document_name": str(r[2] or "Document"),
                "document_type": str(r[1] or "other"),
                "category": str(r[1] or "other").replace("_", " ").title(),
                "description": str(r[3] or ""),
                "file_name": str(r[5] or "document.pdf"),
                "file_size": f"{size_kb} KB",
                "file_size_bytes": int(r[6] or 0),
                "mime_type": str(r[7] or "application/pdf"),
                "document_number": str(r[8] or ""),
                "issue_date": str(r[9]) if r[9] else str(r[12])[:10],
                "verified": bool(r[10]),
                "status": cls.compute_doc_status(r[11], r[10], r[3]),
                "upload_date": str(r[12])[:10] if r[12] else None,
                "signed_url": signed_url,
                "download_url": f"/api/v1/documents/{doc_id}/download"
            })

        return formatted

    @classmethod
    def get_document_record(cls, document_id: str, db: Session) -> Dict[str, Any]:
        """Fetches document metadata by UUID."""
        row = db.execute(text("""
            SELECT sd.id, sd.student_id, sd.document_type, sd.document_title,
                   sd.file_path, sd.file_name, sd.file_size, sd.mime_type,
                   sd.verified, sd.status, s.student_code, s.full_name,
                   sd.description
            FROM student_documents sd
            JOIN students s ON sd.student_id = s.id
            WHERE sd.id = CAST(:id AS UUID)
        """), {"id": document_id}).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Document not found.")

        is_verified = bool(row[8])
        db_st = str(row[9] or "active")
        desc = str(row[12] or "")
        disp_status = cls.compute_doc_status(db_st, is_verified, desc)

        return {
            "id": str(row[0]),
            "student_id": str(row[1]),
            "document_type": str(row[2]),
            "document_title": str(row[3]),
            "file_path": str(row[4]),
            "file_name": str(row[5]),
            "file_size": int(row[6] or 0),
            "mime_type": str(row[7] or "application/pdf"),
            "verified": is_verified,
            "status": disp_status,
            "student_code": str(row[10]),
            "student_name": str(row[11]),
            "description": desc
        }

    @classmethod
    def download_document(
        cls,
        document_id: str,
        current_user: Optional[AuthenticatedUser],
        db: Session
    ) -> Tuple[bytes, str, str]:
        """
        Secure authenticated document download:
        Validates ownership and streams file from private Supabase Storage.
        Returns (file_bytes, content_type, filename).
        """
        doc = cls.get_document_record(document_id, db)

        # Enforce ownership / authorization
        if current_user and (current_user.role or "").lower() == "student":
            caller_code = getattr(current_user, "student_code", None) or current_user.user_id
            if caller_code and caller_code != doc["student_code"] and current_user.id != doc["student_id"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You do not have permission to download this document."
                )

        file_bytes, content_type = cls._download_from_supabase_storage(doc["file_path"])

        # Audit log download
        cls.log_audit(
            actor_id=current_user.id if current_user else None,
            actor_role=current_user.role if current_user else "student",
            action="DOCUMENT_DOWNLOAD",
            entity_id=document_id,
            old_data=None,
            new_data={"document_id": document_id, "file_name": doc["file_name"]},
            reason="Authenticated user downloaded document from private vault",
            db=db
        )

        return file_bytes, content_type or doc["mime_type"], doc["file_name"]

    @classmethod
    def get_signed_url_response(
        cls,
        document_id: str,
        expires_in: int,
        current_user: Optional[AuthenticatedUser],
        db: Session
    ) -> Dict[str, Any]:
        """Generates temporary signed URL for authorized caller."""
        doc = cls.get_document_record(document_id, db)

        # Ownership check
        if current_user and (current_user.role or "").lower() == "student":
            caller_code = getattr(current_user, "student_code", None) or current_user.user_id
            if caller_code and caller_code != doc["student_code"] and current_user.id != doc["student_id"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You do not have permission to access this document."
                )

        signed_url = cls._create_signed_url(doc["file_path"], expires_in=expires_in)
        if not signed_url:
            signed_url = f"/api/v1/documents/{document_id}/download"

        return {
            "document_id": document_id,
            "document_title": doc["document_title"],
            "signed_url": signed_url,
            "expires_in_seconds": expires_in,
            "is_private": True
        }

    # =========================================================================
    # 3. ADMIN OPERATIONS: VERIFY, MANAGE STATUS, AUDIT
    # =========================================================================
    @classmethod
    def get_all_documents_admin(
        cls,
        status_filter: Optional[str],
        doc_type: Optional[str],
        class_name: Optional[str],
        student_code: Optional[str],
        db: Session
    ) -> List[Dict[str, Any]]:
        """Admin console list of student documents with verification controls."""
        q = """
            SELECT sd.id, sd.document_type, sd.document_title, sd.description,
                   sd.file_path, sd.file_name, sd.file_size, sd.mime_type,
                   sd.verified, sd.status, sd.created_at,
                   s.student_code, s.full_name, s.class_name, s.roll_no
            FROM student_documents sd
            JOIN students s ON sd.student_id = s.id
            WHERE 1=1
        """
        params = {}
        if status_filter:
            sf = status_filter.strip().lower()
            if sf == "verified":
                q += " AND sd.verified = TRUE"
            elif sf == "rejected":
                q += " AND (sd.status = 'revoked' OR sd.description LIKE 'REJECTED:%')"
            elif sf in ("pending", "pending_verification"):
                q += " AND (sd.verified IS FALSE OR sd.verified IS NULL) AND sd.status != 'revoked' AND (sd.description NOT LIKE 'REJECTED:%' OR sd.description IS NULL)"
            else:
                q += " AND sd.status = :st"
                params["st"] = status_filter
        if doc_type:
            q += " AND sd.document_type = :dt"
            params["dt"] = doc_type
        if class_name:
            q += " AND s.class_name = :cname"
            params["cname"] = class_name
        if student_code:
            q += " AND s.student_code = :scode"
            params["scode"] = student_code

        q += " ORDER BY sd.created_at DESC LIMIT 100"
        rows = db.execute(text(q), params).fetchall()

        result = []
        for r in rows:
            doc_id = str(r[0])
            fpath = str(r[4])
            signed_url = cls._create_signed_url(fpath, expires_in=3600)
            is_ver = bool(r[8])
            db_st = r[9]
            desc = r[3] or ""
            disp_st = cls.compute_doc_status(db_st, is_ver, desc)

            result.append({
                "id": doc_id,
                "document_id": doc_id,
                "document_type": r[1],
                "document_title": r[2],
                "description": desc,
                "file_name": r[5],
                "file_size": r[6],
                "mime_type": r[7],
                "verified": is_ver,
                "status": disp_st,
                "created_at": str(r[10]) if r[10] else None,
                "student_code": r[11],
                "student_name": r[12],
                "class_name": r[13],
                "roll_no": r[14],
                "signed_url": signed_url,
                "download_url": f"/api/v1/documents/{doc_id}/download"
            })
        return result

    @classmethod
    def verify_document(
        cls,
        document_id: str,
        notes: Optional[str],
        current_user: Optional[AuthenticatedUser],
        db: Session
    ) -> Dict[str, Any]:
        """Admin marks student document as verified."""
        doc = cls.get_document_record(document_id, db)
        admin_id = current_user.id if current_user and len(str(current_user.id)) == 36 else None

        db.execute(text("""
            UPDATE student_documents
            SET verified = TRUE,
                status = 'active',
                verified_by = CASE WHEN :aid IS NOT NULL THEN CAST(:aid AS UUID) ELSE NULL END,
                verified_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = CAST(:id AS UUID)
        """), {"aid": admin_id, "id": document_id})
        db.commit()

        cls.log_audit(
            actor_id=current_user.id if current_user else None,
            actor_role=current_user.role if current_user else "admin",
            action="DOCUMENT_VERIFIED",
            entity_id=document_id,
            old_data={"status": doc["status"], "verified": doc["verified"]},
            new_data={"status": "verified", "verified": True, "notes": notes},
            reason=notes or "Institutional certificate verification passed",
            db=db
        )

        return {
            "success": True,
            "id": document_id,
            "document_id": document_id,
            "status": "verified",
            "verified": True,
            "message": "Document successfully verified and marked official."
        }

    @classmethod
    def reject_document(
        cls,
        document_id: str,
        reason: str,
        current_user: Optional[AuthenticatedUser],
        db: Session
    ) -> Dict[str, Any]:
        """Admin rejects student document with mandatory justification."""
        if not reason or not str(reason).strip():
            raise HTTPException(status_code=400, detail="Rejection reason is mandatory.")

        doc = cls.get_document_record(document_id, db)

        db.execute(text("""
            UPDATE student_documents
            SET verified = FALSE,
                status = 'revoked',
                description = :reason,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = CAST(:id AS UUID)
        """), {"reason": f"REJECTED: {reason}", "id": document_id})
        db.commit()

        cls.log_audit(
            actor_id=current_user.id if current_user else None,
            actor_role=current_user.role if current_user else "admin",
            action="DOCUMENT_REJECTED",
            entity_id=document_id,
            old_data={"status": doc["status"], "verified": doc["verified"]},
            new_data={"status": "rejected", "verified": False, "rejection_reason": reason},
            reason=reason,
            db=db
        )

        return {
            "success": True,
            "id": document_id,
            "document_id": document_id,
            "status": "rejected",
            "verified": False,
            "rejection_reason": reason,
            "message": f"Document rejected: {reason}"
        }

    @classmethod
    def delete_document(
        cls,
        document_id: str,
        current_user: Optional[AuthenticatedUser],
        db: Session
    ) -> Dict[str, Any]:
        """Deletes a document from database and private storage with audit logging."""
        doc = cls.get_document_record(document_id, db)

        # Enforce authorization
        if current_user and (current_user.role or "").lower() == "student":
            caller_code = getattr(current_user, "student_code", None) or current_user.user_id
            if caller_code and caller_code != doc["student_code"] and current_user.id != doc["student_id"]:
                raise HTTPException(status_code=403, detail="Forbidden: Cannot delete other students' documents.")

        # Remove from private Supabase Storage
        try:
            del_url = f"{settings.SUPABASE_URL}/storage/v1/object/{cls.BUCKET_NAME}/{urllib.parse.quote(doc['file_path'])}"
            req = urllib.request.Request(
                del_url,
                headers={
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}"
                },
                method="DELETE"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                pass
        except Exception as e:
            logger.warning("Storage object delete warning [%s]: %s", doc["file_path"], e)

        # Delete database row
        db.execute(text("DELETE FROM student_documents WHERE id = CAST(:id AS UUID)"), {"id": document_id})
        db.commit()

        # Audit log
        cls.log_audit(
            actor_id=current_user.id if current_user else None,
            actor_role=current_user.role if current_user else "student",
            action="DOCUMENT_DELETED",
            entity_id=document_id,
            old_data=doc,
            new_data=None,
            reason="Document purged by authorized user",
            db=db
        )

        return {
            "success": True,
            "document_id": document_id,
            "deleted": True,
            "message": "Document successfully deleted."
        }
