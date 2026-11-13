"""create simulation events table

Revision ID: 20260203_0003
Revises: 20260202_0002
Create Date: 2026-02-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260203_0003"
down_revision: Union[str, None] = "20260202_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "simulation_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_id", sa.String(length=100), nullable=False),
        sa.Column("operation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("delivery_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("vehicle_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("source", sa.String(length=50), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["delivery_id"], ["deliveries.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["operation_id"], ["operations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", name="uq_simulation_events_event_id"),
    )
    op.create_index(
        "ix_simulation_events_delivery_time",
        "simulation_events",
        ["delivery_id", "occurred_at"],
    )
    op.create_index(
        "ix_simulation_events_vehicle_time",
        "simulation_events",
        ["vehicle_id", "occurred_at"],
    )
    op.create_index(
        "ix_simulation_events_operation_time",
        "simulation_events",
        ["operation_id", "occurred_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_simulation_events_operation_time", table_name="simulation_events")
    op.drop_index("ix_simulation_events_vehicle_time", table_name="simulation_events")
    op.drop_index("ix_simulation_events_delivery_time", table_name="simulation_events")
    op.drop_table("simulation_events")
