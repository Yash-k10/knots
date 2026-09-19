from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.models.post_engagement import PostEngagement
from app.analytics.models.profile_view import ProfileView
from app.clubs.models.club import Club
from app.connections.models.connection import Connection, ConnectionStatus
from app.core.repository import BaseRepository
from app.events.models.event import Event
from app.jobs.models.job_posting import JobPosting, JobStatusEnum
from app.posts.models.comment import Comment
from app.posts.models.like import Like
from app.posts.models.post import Post
from app.profiles.models.profile import Profile
from app.users.models.role import Role
from app.users.models.user import User

_stats_cache: dict[str, Any] = {"data": None, "timestamp": 0.0}


class AnalyticsRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_system_stats(self) -> dict:
        """Fetch actual database counts for users, connections, jobs, posts, events, clubs, likes, comments, and views in a single database round-trip."""
        stmt = select(
            select(func.count(User.id))
            .outerjoin(Role, User.role_id == Role.id)
            .where(
                or_(
                    Role.name.is_(None),
                    and_(
                        Role.name != "Super Admin",
                        Role.name != "super admin",
                        Role.name != "superadmin",
                    ),
                )
            )
            .scalar_subquery()
            .label("total_users"),
            select(func.count(Connection.id))
            .where(Connection.status == ConnectionStatus.ACCEPTED)
            .scalar_subquery()
            .label("total_connections"),
            select(func.count(JobPosting.id))
            .where(JobPosting.status == JobStatusEnum.OPEN)
            .scalar_subquery()
            .label("total_jobs"),
            select(func.count(Post.id)).scalar_subquery().label("total_posts"),
            select(func.count(Event.id)).scalar_subquery().label("total_events"),
            select(func.count(Club.id)).scalar_subquery().label("total_clubs"),
            select(func.count(Like.id)).scalar_subquery().label("total_likes"),
            select(func.count(Comment.id)).scalar_subquery().label("total_comments"),
            select(func.count(PostEngagement.id))
            .where(PostEngagement.engagement_type == "view")
            .scalar_subquery()
            .label("total_post_views"),
            select(func.count(ProfileView.id))
            .scalar_subquery()
            .label("total_profile_views"),
        )
        result = await self.db.execute(stmt)
        row = result.first()
        if row is None:
            return {
                "total_users": 0,
                "total_connections": 0,
                "total_jobs": 0,
                "total_posts": 0,
                "total_events": 0,
                "total_clubs": 0,
                "total_likes": 0,
                "total_comments": 0,
                "total_post_views": 0,
                "total_profile_views": 0,
            }

        return {
            "total_users": row.total_users or 0,
            "total_connections": row.total_connections or 0,
            "total_jobs": row.total_jobs or 0,
            "total_posts": row.total_posts or 0,
            "total_events": row.total_events or 0,
            "total_clubs": row.total_clubs or 0,
            "total_likes": row.total_likes or 0,
            "total_comments": row.total_comments or 0,
            "total_post_views": row.total_post_views or 0,
            "total_profile_views": row.total_profile_views or 0,
        }

    async def get_profile_views_history(self, profile_id: int, days: int = 7) -> list:
        """Get profile views history for the last N days, grouped by date."""
        since_date = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(
            days=days
        )

        # Generate a list of dates to guarantee presence
        date_map = {}
        for i in range(days):
            d = (
                datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=i)
            ).date()
            date_map[d.isoformat()] = 0

        query = (
            select(
                func.date(ProfileView.created_at).label("view_date"),
                func.count(ProfileView.id).label("count"),
            )
            .where(ProfileView.profile_id == profile_id)
            .where(ProfileView.created_at >= since_date)
            .group_by(func.date(ProfileView.created_at))
            .order_by(func.date(ProfileView.created_at).asc())
        )

        result = await self.db.execute(query)
        rows = result.all()

        for row in rows:
            # row.view_date can be a date object
            date_str = str(row[0])
            date_map[date_str] = row[1]

        # Convert back to sorted list of dicts
        history = [{"date": k, "views": v} for k, v in sorted(date_map.items())]
        return history

    async def record_profile_view(
        self, profile_id: int, viewer_id: int | None
    ) -> ProfileView:
        """Record a profile view in the database."""
        pv = ProfileView(profile_id=profile_id, viewer_id=viewer_id)
        self.db.add(pv)
        await self.db.flush()
        return pv

    async def record_post_view(
        self, post_id: int, user_id: int | None
    ) -> PostEngagement:
        """Record a post view engagement in the database."""
        pe = PostEngagement(post_id=post_id, user_id=user_id, engagement_type="view")
        self.db.add(pe)
        await self.db.flush()
        return pe

    async def get_user_posts_engagement(self, user_id: int) -> dict:
        """Calculate engagement metrics on posts authored by a user."""
        # Find all user's posts
        posts_query = select(Post.id, Post.content, Post.created_at).where(
            Post.author_id == user_id
        )
        posts_result = await self.db.execute(posts_query)
        user_posts = posts_result.all()

        total_likes = 0
        total_comments = 0
        total_views = 0
        individual_metrics = []

        for p_id, content, created_at in user_posts:
            # Count likes
            likes_q = await self.db.execute(
                select(func.count(Like.id)).where(Like.post_id == p_id)
            )
            likes_count = likes_q.scalar() or 0
            total_likes += likes_count

            # Count comments
            comments_q = await self.db.execute(
                select(func.count(Comment.id)).where(Comment.post_id == p_id)
            )
            comments_count = comments_q.scalar() or 0
            total_comments += comments_count

            # Count views
            views_q = await self.db.execute(
                select(func.count(PostEngagement.id)).where(
                    PostEngagement.post_id == p_id,
                    PostEngagement.engagement_type == "view",
                )
            )
            views_count = views_q.scalar() or 0
            total_views += views_count

            individual_metrics.append(
                {
                    "post_id": p_id,
                    "content_snippet": (
                        content[:50] + "..." if len(content) > 50 else content
                    ),
                    "created_at": created_at.isoformat(),
                    "likes": likes_count,
                    "comments": comments_count,
                    "views": views_count,
                }
            )

        return {
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_views": total_views,
            "posts": individual_metrics,
        }

    async def get_trending_posts(self, limit: int = 5, days: int = 7) -> list:
        """Get top posts across the platform based on weighted engagement in the last N days.

        Weighted engagement score: likes * 2 + comments * 5 + views * 1
        """
        since_date = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(
            days=days
        )

        # Get posts created in the last N days
        posts_query = select(Post).where(Post.created_at >= since_date)
        posts_result = await self.db.execute(posts_query)
        recent_posts = posts_result.scalars().all()

        if not recent_posts:
            # Fallback to all posts if no recent posts found in the timeframe
            posts_query = select(Post)
            posts_result = await self.db.execute(posts_query)
            recent_posts = posts_result.scalars().all()

        trending = []
        for post in recent_posts:
            # Get counts
            likes_q = await self.db.execute(
                select(func.count(Like.id)).where(Like.post_id == post.id)
            )
            likes_count = likes_q.scalar() or 0

            comments_q = await self.db.execute(
                select(func.count(Comment.id)).where(Comment.post_id == post.id)
            )
            comments_count = comments_q.scalar() or 0

            views_q = await self.db.execute(
                select(func.count(PostEngagement.id)).where(
                    PostEngagement.post_id == post.id,
                    PostEngagement.engagement_type == "view",
                )
            )
            views_count = views_q.scalar() or 0

            score = (likes_count * 2) + (comments_count * 5) + (views_count * 1)

            # Get author name
            author_profile_query = select(Profile).where(
                Profile.user_id == post.author_id
            )
            author_profile_res = await self.db.execute(author_profile_query)
            profile = author_profile_res.scalars().first()

            author_name = "Anonymous"
            if profile:
                first = profile.first_name or ""
                last = profile.last_name or ""
                author_name = f"{first} {last}".strip() or "User"

            trending.append(
                {
                    "post_id": post.id,
                    "content": post.content,
                    "created_at": post.created_at.isoformat(),
                    "author_name": author_name,
                    "likes": likes_count,
                    "comments": comments_count,
                    "views": views_count,
                    "score": score,
                }
            )

        # Sort descending by score
        trending.sort(key=lambda x: x["score"], reverse=True)
        return trending[:limit]
