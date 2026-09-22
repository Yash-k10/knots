"""add_faculty_opportunities_tables

Revision ID: 3f0478bb9c3b
Revises: 443e14ecd301
Create Date: 2026-09-20 13:57:24.803017

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "3f0478bb9c3b"
down_revision: Union[str, None] = "443e14ecd301"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "faculty_opportunities",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(255), nullable=False, index=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "opportunity_type",
            sa.String(20),
            nullable=False,
            server_default="JOB",
        ),
        sa.Column("required_skills", sa.JSON(), nullable=True),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("stipend_or_salary", sa.String(100), nullable=True),
        sa.Column("duration", sa.String(100), nullable=True),
        sa.Column("max_applicants", sa.Integer(), nullable=True),
        sa.Column("application_deadline", sa.DateTime(), nullable=True),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="OPEN",
        ),
        sa.Column(
            "posted_by_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_faculty_opportunities_opportunity_type",
        "faculty_opportunities",
        ["opportunity_type"],
    )
    op.create_index(
        "ix_faculty_opportunities_status",
        "faculty_opportunities",
        ["status"],
    )
    op.create_index(
        "ix_faculty_opportunities_created_at",
        "faculty_opportunities",
        ["created_at"],
    )

    op.create_table(
        "opportunity_applications",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "opportunity_id",
            sa.Integer(),
            sa.ForeignKey("faculty_opportunities.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "applicant_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("resume_url", sa.String(500), nullable=True),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column(
            "applied_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "opportunity_id", "applicant_id", name="uq_opportunity_applicant"
        ),
    )
    op.create_index(
        "ix_opportunity_applications_status",
        "opportunity_applications",
        ["status"],
    )


def downgrade() -> None:
    op.drop_table("opportunity_applications")
    op.drop_table("faculty_opportunities")
