"""add jobs portal models

Revision ID: d4e5f6a7b8c9
Revises: 9176aa6b8456
Create Date: 2026-07-20 20:00:00.000000

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "9176aa6b8456"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update companies table with additional fields
    op.add_column(
        "companies", sa.Column("logo_url", sa.String(length=500), nullable=True)
    )
    op.add_column("companies", sa.Column("description", sa.Text(), nullable=True))
    op.add_column(
        "companies", sa.Column("location", sa.String(length=255), nullable=True)
    )
    op.add_column(
        "companies",
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")
        ),
    )
    op.add_column(
        "companies",
        sa.Column(
            "updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")
        ),
    )

    # 2. Drop old tables if they exist from initial schema placeholder
    op.execute("DROP TABLE IF EXISTS referral_requests CASCADE")
    op.execute("DROP TABLE IF EXISTS jobs CASCADE")

    # 3. Create job_postings table
    op.create_table(
        "job_postings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("posted_by_id", sa.Integer(), nullable=False),
        sa.Column(
            "job_type",
            sa.Enum(
                "FULL_TIME",
                "PART_TIME",
                "INTERNSHIP",
                "CONTRACT",
                name="job_type_enum",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column(
            "workplace_type",
            sa.Enum(
                "REMOTE",
                "ON_SITE",
                "HYBRID",
                name="workplace_type_enum",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("salary_min", sa.Integer(), nullable=True),
        sa.Column("salary_max", sa.Integer(), nullable=True),
        sa.Column("salary_range", sa.String(length=100), nullable=True),
        sa.Column("required_skills", sa.JSON(), nullable=True),
        sa.Column("application_deadline", sa.DateTime(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "OPEN",
                "CLOSED",
                name="job_status_enum",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["posted_by_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_job_postings_id"), "job_postings", ["id"], unique=False)
    op.create_index(
        op.f("ix_job_postings_title"), "job_postings", ["title"], unique=False
    )
    op.create_index(
        op.f("ix_job_postings_company_id"), "job_postings", ["company_id"], unique=False
    )
    op.create_index(
        op.f("ix_job_postings_posted_by_id"),
        "job_postings",
        ["posted_by_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_job_postings_status"), "job_postings", ["status"], unique=False
    )

    # 4. Create applications table
    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("job_posting_id", sa.Integer(), nullable=False),
        sa.Column("applicant_id", sa.Integer(), nullable=False),
        sa.Column("resume_url", sa.String(length=500), nullable=True),
        sa.Column("resume_text", sa.Text(), nullable=True),
        sa.Column("cover_letter", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "PENDING",
                "REVIEWED",
                "SHORTLISTED",
                "REJECTED",
                "ACCEPTED",
                name="application_status_enum",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("applied_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["applicant_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["job_posting_id"], ["job_postings.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "job_posting_id", "applicant_id", name="uq_job_posting_applicant"
        ),
    )
    op.create_index(op.f("ix_applications_id"), "applications", ["id"], unique=False)
    op.create_index(
        op.f("ix_applications_job_posting_id"),
        "applications",
        ["job_posting_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_applications_applicant_id"),
        "applications",
        ["applicant_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_applications_status"), "applications", ["status"], unique=False
    )

    # 5. Create referrals table
    op.create_table(
        "referrals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("referrer_id", sa.Integer(), nullable=False),
        sa.Column("job_posting_id", sa.Integer(), nullable=False),
        sa.Column("referred_user_id", sa.Integer(), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["job_posting_id"], ["job_postings.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["referred_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["referrer_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_referrals_id"), "referrals", ["id"], unique=False)
    op.create_index(
        op.f("ix_referrals_referrer_id"), "referrals", ["referrer_id"], unique=False
    )
    op.create_index(
        op.f("ix_referrals_job_posting_id"),
        "referrals",
        ["job_posting_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_referrals_referred_user_id"),
        "referrals",
        ["referred_user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_referrals_referred_user_id"), table_name="referrals")
    op.drop_index(op.f("ix_referrals_job_posting_id"), table_name="referrals")
    op.drop_index(op.f("ix_referrals_referrer_id"), table_name="referrals")
    op.drop_index(op.f("ix_referrals_id"), table_name="referrals")
    op.drop_table("referrals")

    op.drop_index(op.f("ix_applications_status"), table_name="applications")
    op.drop_index(op.f("ix_applications_applicant_id"), table_name="applications")
    op.drop_index(op.f("ix_applications_job_posting_id"), table_name="applications")
    op.drop_index(op.f("ix_applications_id"), table_name="applications")
    op.drop_table("applications")

    op.drop_index(op.f("ix_job_postings_status"), table_name="job_postings")
    op.drop_index(op.f("ix_job_postings_posted_by_id"), table_name="job_postings")
    op.drop_index(op.f("ix_job_postings_company_id"), table_name="job_postings")
    op.drop_index(op.f("ix_job_postings_title"), table_name="job_postings")
    op.drop_index(op.f("ix_job_postings_id"), table_name="job_postings")
    op.drop_table("job_postings")

    op.drop_column("companies", "updated_at")
    op.drop_column("companies", "created_at")
    op.drop_column("companies", "location")
    op.drop_column("companies", "description")
    op.drop_column("companies", "logo_url")
