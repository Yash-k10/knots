"""add_resource_type_to_club_resources

Revision ID: 9d4e5f6a7b8c
Revises: 8c3d4e5f6a7b
Create Date: 2026-09-21 20:14:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "9d4e5f6a7b8c"
down_revision = "8c3d4e5f6a7b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("club_resources")]

    if "resource_type" not in columns:
        op.add_column(
            "club_resources",
            sa.Column(
                "resource_type",
                sa.String(length=20),
                server_default="DOC",
                nullable=False,
            ),
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("club_resources")]

    if "resource_type" in columns:
        op.drop_column("club_resources", "resource_type")
