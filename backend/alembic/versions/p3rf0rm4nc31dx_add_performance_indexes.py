"""add performance indexes

Revision ID: p3rf0rm4nc31dx
Revises: 9176aa6b8456
Create Date: 2026-09-20 01:54:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "p3rf0rm4nc31dx"
down_revision = "9176aa6b8456"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add performance indexes for feed, likes, notifications, and messages queries."""

    # Index on posts.created_at for ORDER BY created_at DESC (feed ordering)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_posts_created_at ON posts (created_at DESC)"
    )

    # Index on posts.visibility for WHERE visibility IN (...) filter
    op.execute("CREATE INDEX IF NOT EXISTS ix_posts_visibility ON posts (visibility)")

    # Composite index on likes (post_id, user_id) for fast is_liked lookups
    # The unique constraint already provides this implicitly, but be explicit
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_likes_post_user ON likes (post_id, user_id)"
    )

    # Index on notifications for unread count: WHERE user_id = ? AND is_read = false
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_notifications_user_unread "
        "ON notifications (user_id, is_read) WHERE is_read = false"
    )

    # Index on messages for unread count: WHERE receiver_id = ? AND is_read = false
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_messages_receiver_unread "
        "ON messages (receiver_id, is_read) WHERE is_read = false"
    )

    # Index on messages for conversation queries: conversation_id + created_at
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_messages_conversation_time "
        "ON messages (conversation_id, created_at DESC)"
    )


def downgrade() -> None:
    """Remove performance indexes."""
    op.execute("DROP INDEX IF EXISTS ix_posts_created_at")
    op.execute("DROP INDEX IF EXISTS ix_posts_visibility")
    op.execute("DROP INDEX IF EXISTS ix_likes_post_user")
    op.execute("DROP INDEX IF EXISTS ix_notifications_user_unread")
    op.execute("DROP INDEX IF EXISTS ix_messages_receiver_unread")
    op.execute("DROP INDEX IF EXISTS ix_messages_conversation_time")
