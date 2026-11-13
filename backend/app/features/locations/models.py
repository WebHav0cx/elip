import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    operation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("operations.id", ondelete="CASCADE"), nullable=False
    )
    location_code: Mapped[str] = mapped_column(String(50), nullable=False)
    location_type: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    state: Mapped[str | None] = mapped_column(String(100))
    lga: Mapped[str | None] = mapped_column(String(100))
    ward: Mapped[str | None] = mapped_column(String(100))
    settlement: Mapped[str | None] = mapped_column(String(30))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    distance_to_hub_km: Mapped[float | None] = mapped_column(Float)
    source_pu_id: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
