"""merge_heads

Revision ID: 443e14ecd301
Revises: ('1d9b6b6aae91', 'p3rf0rm4nc31dx')
Create Date: 2026-09-20 13:56:56.895196

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "443e14ecd301"
down_revision: Union[str, None] = ("1d9b6b6aae91", "p3rf0rm4nc31dx")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
