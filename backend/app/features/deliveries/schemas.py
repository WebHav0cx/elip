from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class DeliveryCreate(BaseModel):
    operation_id: UUID
    delivery_code: str = Field(min_length=1, max_length=50)
    origin_hub_id: UUID
    destination_id: UUID
    demand_units: int = Field(gt=0)
    planned_duration_min: int = Field(gt=0)
    scheduled_dispatch: datetime
    arrival_deadline: datetime

    @model_validator(mode="after")
    def validate_deadline(self):
        if self.arrival_deadline <= self.scheduled_dispatch:
            raise ValueError("arrival_deadline must be after scheduled_dispatch")
        return self


class DeliveryResponse(DeliveryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: Literal[
        "PLANNED", "ASSIGNED", "DISPATCHED", "IN_TRANSIT", "ARRIVED", "CONFIRMED", "CANCELLED"
    ]
    created_at: datetime
