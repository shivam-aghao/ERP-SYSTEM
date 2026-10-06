from typing import Optional
from pydantic import BaseModel

class LoginRequest(BaseModel):
    user_id: Optional[str] = None
    username: Optional[str] = None
    roll_number: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = ""
    role: Optional[str] = "student"

class TokenResponse(BaseModel):
    token: str
    role: str
    user: dict
    redirect: str
