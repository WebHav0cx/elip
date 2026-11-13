from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AssignmentCreate(BaseModel):
    delivery_id: UUID
    vehicle_id: UUID
    personnel_id: UUID
    assigned_at: datetime | None = None


class AssignmentResponse(AssignmentCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    released_at: datetime | None = None
