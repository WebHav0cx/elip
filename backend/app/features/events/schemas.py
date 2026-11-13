from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


EventType = Literal[
    "DELIVERY_DISPATCHED",
    "LOCATION_UPDATE",
    "ARRIVAL_RECORDED",
    "RECEIPT_CONFIRMED",
    "DELAY_REPORTED",
    "TELEMETRY_MISSING",
    "DISRUPTION_STARTED",
    "DISRUPTION_ENDED",
    "VEHICLE_UNAVAILABLE",
]


class EventCreate(BaseModel):
    event_id: str = Field(min_length=1, max_length=100)
    operation_id: UUID
    delivery_id: UUID | None = None
    vehicle_id: UUID | None = None
    event_type: EventType
    occurred_at: datetime
    source: str = Field(default="SIMULATOR", min_length=1, max_length=50)
    payload: dict[str, Any] = Field(default_factory=dict)


class EventResponse(EventCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    received_at: datetime
