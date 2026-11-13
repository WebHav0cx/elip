from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class PersonnelCreate(BaseModel):
    operation_id: UUID
    personnel_code: str = Field(min_length=1, max_length=50)
    role: str = Field(min_length=1, max_length=50)
    availability_start: datetime
    availability_end: datetime

    @model_validator(mode="after")
    def validate_availability_window(self):
        if self.availability_end <= self.availability_start:
            raise ValueError("availability_end must be after availability_start")
        return self


class PersonnelResponse(PersonnelCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
