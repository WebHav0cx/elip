"""create operation entity tables

Revision ID: 20260202_0002
Revises: 20260201_0001
Create Date: 2026-02-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260202_0002"
down_revision: Union[str, None] = "20260201_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("operations", sa.Column("seed", sa.Integer(), nullable=True))
    op.add_column(
        "operations", sa.Column("start_time", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "operations", sa.Column("duration_hours", sa.Integer(), nullable=True)
    )
    op.add_column(
        "operations",
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
    )

    op.create_table(
        "locations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("operation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("location_code", sa.String(length=50), nullable=False),
        sa.Column("location_type", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("lga", sa.String(length=100), nullable=True),
        sa.Column("ward", sa.String(length=100), nullable=True),
        sa.Column("settlement", sa.String(length=30), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("distance_to_hub_km", sa.Float(), nullable=True),
        sa.Column("source_pu_id", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["operation_id"], ["operations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("operation_id", "location_code", name="uq_locations_operation_code"),
    )

    op.create_table(
        "personnel",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("operation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("personnel_code", sa.String(length=50), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("availability_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("availability_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["operation_id"], ["operations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("operation_id", "personnel_code", name="uq_personnel_operation_code"),
    )

    op.create_table(
        "vehicles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("operation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("vehicle_code", sa.String(length=50), nullable=False),
        sa.Column("vehicle_type", sa.String(length=30), nullable=False),
        sa.Column("capacity_units", sa.Integer(), nullable=False),
        sa.Column("base_hub_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("availability_status", sa.String(length=30), server_default="AVAILABLE", nullable=False),
        sa.Column("speed_profile", sa.String(length=100), nullable=True),
        sa.Column("supported_transport_mode", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["base_hub_id"], ["locations.id"]),
        sa.ForeignKeyConstraint(["operation_id"], ["operations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("operation_id", "vehicle_code", name="uq_vehicles_operation_code"),
    )

    op.create_table(
        "deliveries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("operation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("delivery_code", sa.String(length=50), nullable=False),
        sa.Column("origin_hub_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("destination_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("demand_units", sa.Integer(), nullable=False),
        sa.Column("planned_duration_min", sa.Integer(), nullable=False),
        sa.Column("scheduled_dispatch", sa.DateTime(timezone=True), nullable=False),
        sa.Column("arrival_deadline", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=30), server_default="PLANNED", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["destination_id"], ["locations.id"]),
        sa.ForeignKeyConstraint(["operation_id"], ["operations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["origin_hub_id"], ["locations.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("operation_id", "delivery_code", name="uq_deliveries_operation_code"),
    )

    op.create_table(
        "assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("delivery_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("vehicle_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("personnel_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["delivery_id"], ["deliveries.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["personnel_id"], ["personnel.id"]),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("delivery_id", name="uq_assignments_delivery"),
    )


def downgrade() -> None:
    op.drop_table("assignments")
    op.drop_table("deliveries")
    op.drop_table("vehicles")
    op.drop_table("personnel")
    op.drop_table("locations")
    op.drop_column("operations", "updated_at")
    op.drop_column("operations", "duration_hours")
    op.drop_column("operations", "start_time")
    op.drop_column("operations", "seed")
