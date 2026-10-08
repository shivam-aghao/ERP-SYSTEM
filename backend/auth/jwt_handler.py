"""
SSGMCE College ERP — Centralized JWT Token Handler
Issues, verifies, and decodes cryptographically signed JWT access & refresh tokens.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import jwt
from backend.config.settings import settings


class TokenSecurityException(Exception):
    """Base exception for authentication token errors."""
    pass


class TokenExpiredException(TokenSecurityException):
    """Raised when an access or refresh token has expired."""
    pass


class TokenInvalidException(TokenSecurityException):
    """Raised when an authentication token signature or structure is invalid."""
    pass


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed JWT access token.
    Claims: sub, user_id, role, identifier, email, name, permissions, exp, iat, jti, type.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "nbf": now,
        "type": "access",
        "jti": str(uuid.uuid4())
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed JWT refresh token with longer expiration (default 7 days).
    """
    to_encode = {
        "sub": data.get("sub") or data.get("user_id"),
        "user_id": data.get("user_id") or data.get("sub"),
        "role": data.get("role"),
        "identifier": data.get("identifier"),
        "type": "refresh",
        "jti": str(uuid.uuid4())
    }
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "nbf": now
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str, verify_exp: bool = True) -> Dict[str, Any]:
    """
    Decodes and cryptographically verifies a JWT token.
    Raises TokenExpiredException or TokenInvalidException.
    """
    if not token or not isinstance(token, str):
        raise TokenInvalidException("Token is missing or empty")
    
    # Strip any Bearer prefix if passed by mistake
    token = token.strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": verify_exp, "require": ["exp", "sub", "role"]}
        )
        return payload
    except jwt.ExpiredSignatureError as e:
        raise TokenExpiredException("Authentication token has expired. Please log in or refresh your session.") from e
    except (jwt.InvalidTokenError, jwt.DecodeError) as e:
        raise TokenInvalidException(f"Invalid authentication token: {str(e)}") from e

