import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Float, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DelayPrediction(Base):
    __tablename__ = "delay_predictions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    delivery_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False, index=True)
    predicted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    predicted_remaining_minutes: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_eta: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    scheduled_arrival: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    predicted_lateness_minutes: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    risk_level: Mapped[str] = mapped_column(String(30), nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_version: Mapped[str] = mapped_column(String(30), nullable=False)
    data_type: Mapped[str] = mapped_column(String(30), nullable=False, default="SYNTHETIC")
    trigger: Mapped[str] = mapped_column(String(50), nullable=False, default="MANUAL")
    input_features: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
