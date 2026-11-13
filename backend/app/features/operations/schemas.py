from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class OperationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    seed: int | None = None
    start_time: datetime | None = None
    duration_hours: int | None = Field(default=None, gt=0)


class OperationResponse(OperationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime


class OperationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    status: str
