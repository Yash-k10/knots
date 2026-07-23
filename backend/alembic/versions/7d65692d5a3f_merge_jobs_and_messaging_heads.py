"""merge jobs and messaging heads

Revision ID: 7d65692d5a3f
Revises: ('3b13848fe022', 'd4e5f6a7b8c9')
Create Date: 2026-07-23 22:01:21.151452

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "7d65692d5a3f"
down_revision: Union[str, None] = ("3b13848fe022", "d4e5f6a7b8c9")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
