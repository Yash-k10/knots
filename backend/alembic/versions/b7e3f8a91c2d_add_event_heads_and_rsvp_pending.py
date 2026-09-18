"""Add event heads and rsvp pending

Revision ID: b7e3f8a91c2d
Revises: 9a60b941ccfa
Create Date: 2026-09-18 22:35:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7e3f8a91c2d"
down_revision: Union[str, None] = "9a60b941ccfa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("events")]

    if "head_id" not in columns:
        op.add_column("events", sa.Column("head_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_events_head_id", "events", "users", ["head_id"], ["id"]
        )
        op.create_index("ix_events_head_id", "events", ["head_id"])

    if "co_head_id" not in columns:
        op.add_column("events", sa.Column("co_head_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_events_co_head_id", "events", "users", ["co_head_id"], ["id"]
        )
        op.create_index("ix_events_co_head_id", "events", ["co_head_id"])


def downgrade() -> None:
    op.drop_constraint("fk_events_co_head_id", "events", type_="foreignkey")
    op.drop_index("ix_events_co_head_id", table_name="events")
    op.drop_column("events", "co_head_id")

    op.drop_constraint("fk_events_head_id", "events", type_="foreignkey")
    op.drop_index("ix_events_head_id", table_name="events")
    op.drop_column("events", "head_id")
