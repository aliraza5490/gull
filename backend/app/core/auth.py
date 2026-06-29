"""
Authentication utilities for password hashing and JWT tokens.
"""

from datetime import datetime, timezone, timedelta
import uuid
from typing import Optional
import jwt
import bcrypt
from app.core.config import settings


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify clean password matches the hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: uuid.UUID) -> str:
    """Create a signed JWT access token for a user."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": str(user_id), "exp": expire}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> Optional[uuid.UUID]:
    """Decode a JWT access token and return the user UUID."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        return uuid.UUID(user_id_str)
    except Exception:
        return None
