import re
from typing import Dict, Any

ERR_INVALID_CREDENTIALS = "Invalid User ID or Password. Please verify your credentials."
ERR_ACCOUNT_INACTIVE = "Your account is marked inactive. Please contact the administrator."
ERR_ACCOUNT_BLOCKED = "Your account has been blocked. Please contact the college admin."
ERR_SERVER_ERROR = "An error occurred while processing authentication. Please try again."

def sanitize_user_id(user_id: str) -> str:
    """
    Cleans and standardizes the user ID input.
    Trims leading/trailing whitespace.
    """
    if not user_id:
        return ""
    return user_id.strip()

def validate_user_id(user_id: str) -> bool:
    """
    Validates user ID format (alphanumeric, min length 3, max length 50).
    """
    clean_id = sanitize_user_id(user_id)
    if not clean_id or len(clean_id) < 3 or len(clean_id) > 50:
        return False
    return bool(re.match(r"^[A-Za-z0-9_\-]+$", clean_id))

def get_role_redirect_path(role: str) -> str:
    """
    Returns standard front-end relative route path according to role.
    """
    normalized_role = (role or "").strip().lower()
    if normalized_role == "student":
        return "/ERP-SYSTEM/Student_dashbord/frontend/index.html"
    elif normalized_role == "faculty":
        return "/ERP-SYSTEM/Teacher%20_dashbord/frontend/index.html"
    elif normalized_role == "admin":
        return "/ERP-SYSTEM/admin_dashboard.html"
    return "../../index.html"
