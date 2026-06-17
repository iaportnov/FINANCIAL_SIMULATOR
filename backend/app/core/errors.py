from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class DomainError(Exception):
    """Base for domain errors mapped to a consistent JSON envelope."""

    code = "error"
    status_code = 400

    def __init__(
        self,
        message: str,
        *,
        code: str | None = None,
        status_code: int | None = None,
    ) -> None:
        self.message = message
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code
        super().__init__(message)


class NotFoundError(DomainError):
    code = "not_found"
    status_code = 404


class ValidationError(DomainError):
    code = "validation_error"
    status_code = 422


class PermissionDeniedError(DomainError):
    code = "permission_denied"
    status_code = 403


class ConflictError(DomainError):
    code = "conflict"
    status_code = 409


class AuthError(DomainError):
    code = "unauthorized"
    status_code = 401


def _body(code: str, message: str, details=None) -> dict:
    body: dict = {"error": {"code": code, "message": message}}
    if details is not None:
        body["error"]["details"] = details
    return body


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def _domain(_: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=_body(exc.code, exc.message))

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=_body("validation_error", "Request validation failed", jsonable_encoder(exc.errors())),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = {
            401: "unauthorized",
            403: "permission_denied",
            404: "not_found",
            409: "conflict",
        }.get(exc.status_code, "http_error")
        return JSONResponse(status_code=exc.status_code, content=_body(code, str(exc.detail)))
