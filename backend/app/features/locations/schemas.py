from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LocationCreate(BaseModel):
    operation_id: UUID
    location_code: str = Field(min_length=1, max_length=50)
    location_type: Literal["HUB", "DESTINATION"]
    name: str = Field(min_length=1, max_length=200)
    state: str | None = None
    lga: str | None = None
    ward: str | None = None
    settlement: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    distance_to_hub_km: float | None = Field(default=None, ge=0)
    source_pu_id: str | None = None


class LocationResponse(LocationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
