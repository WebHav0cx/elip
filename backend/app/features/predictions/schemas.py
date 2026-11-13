from datetime import datetime
from typing import Literal
from uuid import UUID
from typing import Any

from pydantic import BaseModel, ConfigDict


class PredictionRunRequest(BaseModel):
    delivery_id: UUID
    trigger: str = "MANUAL"


class PredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    delivery_id: UUID
    predicted_at: datetime
    predicted_remaining_minutes: float
    predicted_eta: datetime
    scheduled_arrival: datetime
    predicted_lateness_minutes: float
    risk_level: Literal["LOW", "AT_RISK", "HIGH"]
    model_name: str
    model_version: str
    data_type: str
    trigger: str
    input_features: dict[str, Any]
    created_at: datetime
