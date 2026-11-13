import logging
from uuid import uuid4

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.schemas.responses import ErrorBody, ErrorResponse, ResponseMeta


logger = logging.getLogger(__name__)


def request_id(request: Request) -> str:
    return getattr(request.state, "request_id", str(uuid4()))


def error_response(
    request: Request,
    status_code: int,
    code: str,
    message: str,
    details: object | None = None,
) -> JSONResponse:
    payload = ErrorResponse(
        error=ErrorBody(code=code, message=message, details=details),
        meta=ResponseMeta(request_id=request_id(request)),
    )
    return JSONResponse(status_code=status_code, content=payload.model_dump())


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return error_response(
        request,
        422,
        "VALIDATION_ERROR",
        "Request validation failed.",
        exc.errors(),
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    code_by_status = {
        400: "BAD_REQUEST",
        401: "UNAUTHENTICATED",
        403: "FORBIDDEN",
        404: "RESOURCE_NOT_FOUND",
        409: "RESOURCE_CONFLICT",
        503: "SERVICE_UNAVAILABLE",
    }
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed."
    return error_response(
        request,
        exc.status_code,
        code_by_status.get(exc.status_code, "HTTP_ERROR"),
        detail,
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception request_id=%s", request_id(request))
    return error_response(
        request,
        500,
        "INTERNAL_ERROR",
        "An unexpected error occurred.",
    )
