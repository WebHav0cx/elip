from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class VehicleCreate(BaseModel):
    operation_id: UUID
    vehicle_code: str = Field(min_length=1, max_length=50)
    vehicle_type: Literal["bus", "truck", "motorcycle", "boat"]
    capacity_units: int = Field(gt=0)
    base_hub_id: UUID
    availability_status: Literal["AVAILABLE", "UNAVAILABLE"] = "AVAILABLE"
    speed_profile: str | None = Field(default=None, max_length=100)
    supported_transport_mode: Literal["road", "water"]


class VehicleResponse(VehicleCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
