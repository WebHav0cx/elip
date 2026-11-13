"""add persisted prediction forecasts

Revision ID: 20260205_0005
Revises: 20260204_0004
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260205_0005"
down_revision: Union[str, None] = "20260204_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "delay_predictions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("delivery_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("predicted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("predicted_remaining_minutes", sa.Float(), nullable=False),
        sa.Column("predicted_eta", sa.DateTime(timezone=True), nullable=False),
        sa.Column("scheduled_arrival", sa.DateTime(timezone=True), nullable=False),
        sa.Column("predicted_lateness_minutes", sa.Float(), nullable=False),
        sa.Column("risk_level", sa.String(length=30), nullable=False),
        sa.Column("model_name", sa.String(length=100), nullable=False),
        sa.Column("model_version", sa.String(length=30), nullable=False),
        sa.Column("data_type", sa.String(length=30), nullable=False),
        sa.Column("trigger", sa.String(length=50), nullable=False),
        sa.Column("input_features", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["delivery_id"], ["deliveries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_delay_predictions_delivery_id", "delay_predictions", ["delivery_id"])


def downgrade() -> None:
    op.drop_index("ix_delay_predictions_delivery_id", table_name="delay_predictions")
    op.drop_table("delay_predictions")
