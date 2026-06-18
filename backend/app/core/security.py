from datetime import datetime, timedelta, timezone
from uuid import uuid4

import bcrypt
import jwt

from app.core.config import settings


# --- Password hashing (bcrypt directly; no passlib) -------------------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


# --- JWT (access in memory on client, refresh in httpOnly cookie) -----------

def _create_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "jti": uuid4().hex,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str) -> str:
    return _create_token(
        subject, "access", timedelta(minutes=settings.jwt_access_ttl_minutes)
    )


def create_refresh_token(subject: str) -> str:
    return _create_token(
        subject, "refresh", timedelta(days=settings.jwt_refresh_ttl_days)
    )


def decode_token(token: str) -> dict:
    """Decode and verify a JWT. Raises jwt.PyJWTError on failure."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
