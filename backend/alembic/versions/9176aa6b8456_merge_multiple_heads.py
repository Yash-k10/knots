"""merge multiple heads

Revision ID: 9176aa6b8456
Revises: ('e81b98b21354', 'adc0ea3bd499')
Create Date: 2026-07-19 20:18:59.154361

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "9176aa6b8456"
down_revision: str | None = ("e81b98b21354", "adc0ea3bd499")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
