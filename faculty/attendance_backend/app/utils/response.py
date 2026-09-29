from typing import Any, Optional
from fastapi.responses import JSONResponse

def success_response(data: Any = None, message: str = "Operation successful", code: int = 200) -> dict:
    return {
        "success": True,
        "code": code,
        "message": message,
        "data": data
    }

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
