"""add notification_preferences table

Revision ID: f1a2b3c4d5e6
Revises: 7b2cba85bb69
Create Date: 2026-07-28 08:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: str | None = "7b2cba85bb69"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "notification_preferences",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "notify_on_like", sa.Boolean(), nullable=False, server_default="true"
        ),
        sa.Column(
            "notify_on_comment", sa.Boolean(), nullable=False, server_default="true"
        ),
        sa.Column(
            "notify_on_connection_request",
            sa.Boolean(),
            nullable=False,
            server_default="true",
        ),
        sa.Column(
            "notify_on_event_rsvp",
            sa.Boolean(),
            nullable=False,
            server_default="true",
        ),
        sa.Column(
            "notify_on_message", sa.Boolean(), nullable=False, server_default="true"
        ),
        sa.Column(
            "notify_on_job_alert", sa.Boolean(), nullable=False, server_default="true"
        ),
        sa.Column(
            "notify_on_general", sa.Boolean(), nullable=False, server_default="true"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_notification_prefs_user"),
    )
    op.create_index(
        op.f("ix_notification_preferences_id"),
        "notification_preferences",
        ["id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_notification_preferences_id"), table_name="notification_preferences"
    )
    op.drop_table("notification_preferences")
