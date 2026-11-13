from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field


DataT = TypeVar("DataT")


class ResponseMeta(BaseModel):
    request_id: str | None = None
    page: int | None = None
    page_size: int | None = None
    total: int | None = None


class SuccessResponse(BaseModel, Generic[DataT]):
    data: DataT
    meta: ResponseMeta = Field(default_factory=ResponseMeta)


class ErrorBody(BaseModel):
    code: str
    message: str
    details: Any | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody
    meta: ResponseMeta = Field(default_factory=ResponseMeta)
