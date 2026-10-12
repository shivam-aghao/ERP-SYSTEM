"""
SSGMCE College ERP — Authentication Data Models
Provides structured Pydantic models for authentication, tokens, and verified user profiles.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AuthenticatedUser(BaseModel):
    """Authoritative user identity verified by server-side database and JWT claims."""
    id: str = Field(..., description="Unique UUID of the user")
    user_id: Optional[str] = None
    identifier: str = Field(..., description="Canonical ID (student_code, emp_code, or username)")
    full_name: str = Field(..., description="Verified display name")
    email: Optional[str] = Field(None, description="Registered institutional email")
    role: str = Field(..., description="Authoritative ERP role: student, teacher, admin, hod, super_admin")
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    class_id: Optional[str] = None
    class_name: Optional[str] = None
    roll_no: Optional[Any] = None
    permissions: List[str] = Field(default_factory=list, description="Assigned granular permissions")
    is_active: bool = True

    def model_post_init(self, __context: Any) -> None:
        if not self.user_id:
            self.user_id = self.id

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Standardized OAuth2/JWT token response."""
    access_token: str
    token: Optional[str] = None
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]
    role: str
    redirect: str

    def model_post_init(self, __context: Any) -> None:
        if not self.token:
            self.token = self.access_token


class RefreshTokenRequest(BaseModel):
    """Payload for refreshing an expired access token."""
    refresh_token: str


class LoginPayload(BaseModel):
    """Login payload compatible with Student, Teacher, and Administrator portals."""
    user_id: Optional[str] = None
    username: Optional[str] = None
    roll_number: Optional[str] = None
    email: Optional[str] = None
    password: str
    role: Optional[str] = None
