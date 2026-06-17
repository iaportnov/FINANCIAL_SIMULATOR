from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response

from app.core.config import settings
from app.core.errors import AuthError
from app.modules.users.deps import CurrentUser, get_user_service
from app.modules.users.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from app.modules.users.service import UserService

router = APIRouter(tags=["users"])

REFRESH_COOKIE = "refresh_token"
REFRESH_PATH = "/api/v1/auth"

ServiceDep = Annotated[UserService, Depends(get_user_service)]


def _set_refresh_cookie(response: Response, refresh: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.jwt_refresh_ttl_days * 24 * 3600,
        path=REFRESH_PATH,
    )


@router.post("/auth/register", response_model=UserPublic, status_code=201)
async def register(body: RegisterRequest, service: ServiceDep) -> UserPublic:
    return await service.register(body.email, body.password, body.display_name)  # type: ignore[return-value]


@router.post("/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response, service: ServiceDep) -> TokenResponse:
    user = await service.authenticate(body.email, body.password)
    access, refresh = await service.issue_tokens(user)
    _set_refresh_cookie(response, refresh)
    return TokenResponse(access_token=access)


@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh(request: Request, response: Response, service: ServiceDep) -> TokenResponse:
    raw = request.cookies.get(REFRESH_COOKIE)
    if not raw:
        raise AuthError("Missing refresh token")
    access, new_refresh = await service.refresh(raw)
    _set_refresh_cookie(response, new_refresh)
    return TokenResponse(access_token=access)


@router.post("/auth/logout")
async def logout(response: Response) -> dict:
    response.delete_cookie(REFRESH_COOKIE, path=REFRESH_PATH)
    return {"ok": True}


@router.get("/me", response_model=UserPublic)
async def me(current_user: CurrentUser) -> UserPublic:
    return current_user  # type: ignore[return-value]
