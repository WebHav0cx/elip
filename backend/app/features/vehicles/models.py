import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    operation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("operations.id", ondelete="CASCADE"), nullable=False
    )
    vehicle_code: Mapped[str] = mapped_column(String(50), nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(30), nullable=False)
    capacity_units: Mapped[int] = mapped_column(Integer, nullable=False)
    base_hub_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False
    )
    availability_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="AVAILABLE", server_default="AVAILABLE"
    )
    speed_profile: Mapped[str | None] = mapped_column(String(100))
    supported_transport_mode: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
