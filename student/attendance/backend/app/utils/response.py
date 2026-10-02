from typing import Any, Optional
from fastapi.responses import JSONResponse

def success_response(data: Any = None, message: str = "Operation successful", code: int = 200, meta: Optional[dict] = None) -> dict:
    resp = {
        "success": True,
        "code": code,
        "message": message,
        "data": data
    }
    if meta is not None:
        resp["meta"] = meta
    return resp

def error_response(message: str = "An error occurred", code: int = 400, details: Optional[Any] = None) -> JSONResponse:
    content = {
        "success": False,
        "code": code,
        "message": message,
        "error": {
            "code": code,
            "message": message,
            "details": details
        }
    }
    return JSONResponse(status_code=code, content=content)
