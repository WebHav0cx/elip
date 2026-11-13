import logging
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request

from app.core.config import settings
from app.core.errors import (
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.db.session import engine
from app.features.operations.router import router as operations_router
from app.features.assignments.router import router as assignments_router
from app.features.deliveries.router import router as deliveries_router
from app.features.events.router import (
    monitoring_router,
    telemetry_router,
    timeline_router,
)
from app.features.locations.router import router as locations_router
from app.features.personnel.router import router as personnel_router
from app.features.vehicles.router import router as vehicles_router
from app.features.auth.router import router as auth_router
from app.features.predictions.router import router as predictions_router


logging.basicConfig(level=settings.log_level.upper())


def _cors_origins() -> list[str]:
    origins = [
        origin.strip().rstrip("/")
        for origin in settings.cors_origins.split(",")
        if origin.strip()
    ]
    if not origins:
        raise RuntimeError("CORS_ORIGINS must contain at least one origin")
    if "*" in origins:
        raise RuntimeError("Wildcard CORS origins are not permitted")
    return origins


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Accept", "Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
    max_age=600,
)
app.add_middleware(RequestIDMiddleware)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)
app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(predictions_router, prefix="/api/v1", tags=["predictions"])
app.include_router(
    operations_router,
    prefix="/api/v1/operations",
    tags=["operations"],
)
app.include_router(
    locations_router,
    prefix="/api/v1/operations/{operation_id}/locations",
    tags=["locations"],
)
app.include_router(
    vehicles_router,
    prefix="/api/v1/operations/{operation_id}/vehicles",
    tags=["vehicles"],
)
app.include_router(
    personnel_router,
    prefix="/api/v1/operations/{operation_id}/personnel",
    tags=["personnel"],
)
app.include_router(
    deliveries_router,
    prefix="/api/v1/operations/{operation_id}/deliveries",
    tags=["deliveries"],
)
app.include_router(
    assignments_router,
    prefix="/api/v1/deliveries/{delivery_id}/assignments",
    tags=["assignments"],
)
app.include_router(telemetry_router, prefix="/api/v1/telemetry", tags=["telemetry"])
app.include_router(timeline_router, prefix="/api/v1/deliveries", tags=["events"])
app.include_router(monitoring_router, prefix="/api/v1/operations", tags=["monitoring"])


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    """Return a lightweight liveness response for Docker and load balancers."""
    return {"status": "ok"}


@app.get("/ready", tags=["system"])
def ready() -> dict[str, str]:
    """Confirm that the API can reach the configured database."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database unavailable") from exc

    return {"status": "ready", "database": "connected"}


@app.get("/", tags=["system"])
def root() -> dict[str, str]:
    return {"service": "election-api", "status": "ok"}
