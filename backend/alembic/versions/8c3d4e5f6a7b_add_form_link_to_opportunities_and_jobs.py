"""add_form_link_to_opportunities_and_jobs

Revision ID: 8c3d4e5f6a7b
Revises: 6b2c3d4e5f6a
Create Date: 2026-09-21 18:40:00.000000

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "8c3d4e5f6a7b"
down_revision: Union[str, None] = "6b2c3d4e5f6a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add form_link to faculty_opportunities if not exists
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "ALTER TABLE faculty_opportunities ADD COLUMN IF NOT EXISTS form_link VARCHAR(500);"
        )
    )
    conn.execute(
        sa.text(
            "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS form_link VARCHAR(500);"
        )
    )


def downgrade() -> None:
    op.drop_column("faculty_opportunities", "form_link")
    op.drop_column("job_postings", "form_link")
