from typing import Generator, Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.database import get_db, get_supabase_client
from app.models.db_models import Teacher
from app.utils.security import decode_token

security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db)
) -> Teacher:
    if not credentials:
        # Check if default teacher exists for development convenience
        teacher = db.query(Teacher).first()
        if teacher:
            return teacher
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    try:
        payload = decode_token(token, is_refresh=False)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    teacher = db.query(Teacher).filter((Teacher.id == user_id) | (Teacher.emp_code == user_id) | (Teacher.email == user_id)).first()
    if not teacher:
        # Check if fallback teacher exists
        teacher = db.query(Teacher).first()
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher profile not found",
            )
    
    return teacher

def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db)
) -> Optional[Teacher]:
    if not credentials:
        return db.query(Teacher).first()
    try:
        return get_current_user(credentials, db)
    except Exception:
        return db.query(Teacher).first()
