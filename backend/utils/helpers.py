import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Optional, Dict
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger("ssgmce_erp_backend.utils")

def success_response(data: Any = None, message: str = "Success", meta: Optional[Dict[str, Any]] = None, code: int = 200):
    payload = {
        "success": True,
        "code": code,
        "message": message,
        "data": data
    }
    if meta is not None:
        payload["meta"] = meta
    return payload

def error_response(message: str = "Error", code: int = 400, details: Any = None):
    return JSONResponse(
        status_code=code,
        content={
            "success": False,
            "code": code,
            "message": message,
            "error": {
                "code": code,
                "message": message,
                "details": details
            }
        }
    )

def ensure_utc(val: Any) -> Optional[datetime]:
    if not val:
        return None
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    if isinstance(val, str):
        try:
            val_clean = val.replace("Z", "+00:00")
            dt = datetime.fromisoformat(val_clean)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            return None
    return None

def log_audit(db: Session, user_id: str, action: str, entity_name: str, entity_id: str, payload: Optional[Dict] = None):
    try:
        db.execute(
            text("""
            INSERT INTO quiz_audit_logs (id, user_id, action, entity_name, entity_id, payload, created_at)
            VALUES (:id, :uid, :act, :ename, :eid, :pld, CURRENT_TIMESTAMP)
            """),
            {
                "id": str(uuid.uuid4()),
                "uid": user_id,
                "act": action,
                "ename": entity_name,
                "eid": entity_id,
                "pld": json.dumps(payload or {})
            }
        )
    except Exception as e:
        logger.warning("Audit log notice: %s", e)
