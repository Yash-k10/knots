from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.models.post_engagement import PostEngagement
from app.analytics.models.profile_view import ProfileView
from app.connections.models.connection import Connection, ConnectionStatus
from app.core.repository import BaseRepository
from app.jobs.models.job_posting import JobPosting, JobStatusEnum
from app.posts.models.comment import Comment
from app.posts.models.like import Like
from app.posts.models.post import Post
from app.profiles.models.profile import Profile
from app.users.models.user import User


class AnalyticsRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_system_stats(self) -> dict:
        """Fetch actual database counts for users, connections, jobs, and posts."""
        # 1. Total users
        users_result = await self.db.execute(select(func.count(User.id)))
        total_users = users_result.scalar() or 0

        # 2. Total accepted connections
        connections_result = await self.db.execute(
            select(func.count(Connection.id)).where(
                Connection.status == ConnectionStatus.ACCEPTED
            )
        )
        total_connections = connections_result.scalar() or 0

        # 3. Total jobs (open/active)
        jobs_result = await self.db.execute(
            select(func.count(JobPosting.id)).where(
                JobPosting.status == JobStatusEnum.OPEN
            )
        )
        total_jobs = jobs_result.scalar() or 0

        # 4. Total posts
        posts_result = await self.db.execute(select(func.count(Post.id)))
        total_posts = posts_result.scalar() or 0

        return {
            "total_users": total_users,
            "total_connections": total_connections,
            "total_jobs": total_jobs,
            "total_posts": total_posts,
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

    async def get_trending_posts(self, limit: int = 5) -> list:
        """Get top posts across the platform based on weighted engagement in the last 7 days.

        Weighted engagement score: likes * 2 + comments * 5 + views * 1
        """
        since_date = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=7)

        # Get posts created in the last 7 days
        posts_query = select(Post).where(Post.created_at >= since_date)
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
