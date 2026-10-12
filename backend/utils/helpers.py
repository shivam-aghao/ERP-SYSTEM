import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Optional, Dict
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger("ssgmce_erp_backend.utils")

def success_response(data: Any = None, message: Optional[str] = None, meta: Optional[Dict[str, Any]] = None, code: int = 200):
    payload = {
        "success": True,
        "data": data if data is not None else {},
        "message": message,
        "code": code
    }
    if meta is not None:
        payload["meta"] = meta
    if code != 200:
        return JSONResponse(status_code=code, content=jsonable_encoder(payload))
    return payload

def error_response(message: str = "Error", code: Any = 400, details: Any = None, error_code: Optional[str] = None):
    if isinstance(message, str) and (isinstance(code, int) or str(code).isdigit()):
        status_code = int(code)
        err_msg = message
        status_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "CONFLICT",
            422: "VALIDATION_ERROR",
            500: "INTERNAL_SERVER_ERROR"
        }
        err_code = error_code or status_map.get(status_code, "ERROR")
    elif isinstance(message, str) and not isinstance(code, int):
        err_code = message
        err_msg = str(code)
        status_code = int(details) if isinstance(details, int) else 400
        details = None
    else:
        err_msg = str(message)
        err_code = "ERROR"
        status_code = 400

    content = {
        "success": False,
        "data": None,
        "error": {
            "code": err_code,
            "message": err_msg
        },
        "message": err_msg,
        "code": status_code
    }
    if details is not None:
        content["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=jsonable_encoder(content))

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
