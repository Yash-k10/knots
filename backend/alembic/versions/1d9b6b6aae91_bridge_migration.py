"""Bridge revision for database sync

Revision ID: 1d9b6b6aae91
Revises: 9a60b941ccfa
Create Date: 2026-09-18 20:00:00.000000

"""

from typing import Sequence, Union

revision: str = "1d9b6b6aae91"
down_revision: Union[str, None] = "9a60b941ccfa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
