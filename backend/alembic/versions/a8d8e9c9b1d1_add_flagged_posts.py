"""add flagged posts

Revision ID: a8d8e9c9b1d1
Revises: 9176aa6b8456
Create Date: 2026-07-21 21:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a8d8e9c9b1d1"
down_revision: Union[str, None] = "9176aa6b8456"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "flagged_posts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("post_id", sa.Integer(), nullable=False),
        sa.Column("flagger_id", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column(
            "status", sa.String(length=50), nullable=False, server_default="pending"
        ),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.ForeignKeyConstraint(["flagger_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_flagged_posts_flagger_id"),
        "flagged_posts",
        ["flagger_id"],
        unique=False,
    )
    op.create_index(op.f("ix_flagged_posts_id"), "flagged_posts", ["id"], unique=False)
    op.create_index(
        op.f("ix_flagged_posts_post_id"), "flagged_posts", ["post_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_flagged_posts_post_id"), table_name="flagged_posts")
    op.drop_index(op.f("ix_flagged_posts_id"), table_name="flagged_posts")
    op.drop_index(op.f("ix_flagged_posts_flagger_id"), table_name="flagged_posts")
    op.drop_table("flagged_posts")
