"""add_event_faculty_coordinator

Revision ID: 6b2c3d4e5f6a
Revises: 5a1b2c3d4e5f
Create Date: 2026-09-21 00:20:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "6b2c3d4e5f6a"
down_revision: Union[str, None] = "5a1b2c3d4e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "events",
        sa.Column(
            "faculty_coordinator_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_events_faculty_coordinator_id", "events", ["faculty_coordinator_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_events_faculty_coordinator_id", table_name="events")
    op.drop_column("events", "faculty_coordinator_id")
