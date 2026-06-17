import hashlib
from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import AuthError, ConflictError, NotFoundError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.modules.users.models import RefreshToken, User, UserRole
from app.modules.users.repository import UserRepository


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = UserRepository(session)

    async def register(self, email: str, password: str, display_name: str) -> User:
        if await self.repo.get_by_email(email):
            raise ConflictError("Email already registered")
        user = User(
            email=email,
            password_hash=hash_password(password),
            display_name=display_name,
            role=UserRole.user.value,
        )
        return await self.repo.add(user)

    async def authenticate(self, email: str, password: str) -> User:
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise AuthError("Invalid email or password")
        return user

    async def issue_tokens(self, user: User) -> tuple[str, str]:
        access = create_access_token(str(user.id))
        refresh = create_refresh_token(str(user.id))
        await self.repo.add_refresh_token(
            RefreshToken(
                user_id=user.id,
                token_hash=_hash_token(refresh),
                expires_at=datetime.now(timezone.utc)
                + timedelta(days=settings.jwt_refresh_ttl_days),
            )
        )
        return access, refresh

    async def refresh(self, raw_refresh: str) -> tuple[str, str]:
        try:
            payload = decode_token(raw_refresh)
        except jwt.PyJWTError as exc:
            raise AuthError("Invalid refresh token") from exc
        if payload.get("type") != "refresh":
            raise AuthError("Wrong token type")
        stored = await self.repo.get_refresh_token(_hash_token(raw_refresh))
        if not stored or stored.revoked:
            raise AuthError("Refresh token revoked")
        stored.revoked = True  # rotate: invalidate the used token
        user = await self.get_user(int(payload["sub"]))
        return await self.issue_tokens(user)

    async def get_user(self, user_id: int) -> User:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user
