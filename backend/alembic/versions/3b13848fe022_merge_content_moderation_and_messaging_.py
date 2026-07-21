"""merge content moderation and messaging heads

Revision ID: 3b13848fe022
Revises: ('a8d8e9c9b1d1', 'edbdde4f8149')
Create Date: 2026-07-21 21:30:49.998569

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "3b13848fe022"
down_revision: Union[str, None] = ("a8d8e9c9b1d1", "edbdde4f8149")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
