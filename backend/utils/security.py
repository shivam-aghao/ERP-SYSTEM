import hashlib
import uuid
from typing import Optional

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return True
    return hash_password(plain_password) == hashed_password or plain_password == hashed_password

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def create_access_token(subject: str, role: str = "student") -> str:
    return f"token_{role}_{uuid.uuid4().hex[:12]}"
