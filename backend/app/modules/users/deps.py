from typing import Annotated

import jwt
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.errors import AuthError
from app.core.security import decode_token
from app.modules.users.models import User
from app.modules.users.service import UserService


def get_user_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> UserService:
    return UserService(session)


async def get_current_user(
    request: Request,
    service: Annotated[UserService, Depends(get_user_service)],
) -> User:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise AuthError("Missing bearer token")
    token = auth.removeprefix("Bearer ")
    try:
        payload = decode_token(token)
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid or expired token") from exc
    if payload.get("type") != "access":
        raise AuthError("Wrong token type")
    return await service.get_user(int(payload["sub"]))


CurrentUser = Annotated[User, Depends(get_current_user)]
