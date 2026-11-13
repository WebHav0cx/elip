from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str = Field(min_length=3, max_length=320)
    role: str
    is_active: bool


class AdminUserCreate(BaseModel):
    email: str
    password: str = Field(min_length=8)
    role: str = Field(default="VIEWER", pattern="^(ADMIN|OPERATOR|VIEWER|SIMULATION_OPERATOR)$")


class MembershipCreate(BaseModel):
    user_id: UUID
    role: str = Field(default="VIEWER", pattern="^(OPERATOR|VIEWER|SIMULATION_OPERATOR)$")


class MembershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    operation_id: UUID
    role: str
