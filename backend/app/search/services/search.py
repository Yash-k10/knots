from typing import Optional
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.events.models.event import Event
from app.jobs.models.company import Company
from app.jobs.models.job_posting import JobPosting
from app.posts.models.post import Post
from app.profiles.models.profile import Profile
from app.search.schemas.search import (
    EventSearchResult,
    GlobalSearchResponse,
    JobSearchResult,
    PostSearchResult,
    UserSearchResult,
)
from app.users.models.user import User


class SearchService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_all(
        self,
        query: str,
        category: Optional[str] = "all",
        limit: int = 10,
    ) -> GlobalSearchResponse:
        term = query.strip()
        if not term:
            return GlobalSearchResponse(query=query, total_results=0)

        search_pattern = f"%{term}%"
        users_list = []
        posts_list = []
        jobs_list = []
        events_list = []

        category_lower = (category or "all").lower()

        # 1. Search Users / Profiles
        if category_lower in ("all", "users"):
            stmt = (
                select(User)
                .outerjoin(Profile, User.id == Profile.user_id)
                .where(
                    or_(
                        User.email.ilike(search_pattern),
                        Profile.first_name.ilike(search_pattern),
                        Profile.last_name.ilike(search_pattern),
                        Profile.department.ilike(search_pattern),
                        Profile.bio.ilike(search_pattern),
                    )
                )
                .options(selectinload(User.profile))
                .limit(limit)
            )
            res = await self.db.execute(stmt)
            users_query = res.scalars().all()

            for u in users_query:
                fname = u.profile.first_name if u.profile else None
                lname = u.profile.last_name if u.profile else None
                dept = u.profile.department if u.profile else None
                pic = u.profile.profile_picture if u.profile else None

                users_list.append(
                    UserSearchResult(
                        id=u.id,
                        email=u.email,
                        first_name=fname,
                        last_name=lname,
                        department=dept,
                        profile_picture=pic,
                    )
                )

        # 2. Search Posts
        if category_lower in ("all", "posts"):
            stmt = (
                select(Post)
                .where(Post.content.ilike(search_pattern))
                .options(selectinload(Post.author).selectinload(User.profile))
                .limit(limit)
            )
            res = await self.db.execute(stmt)
            posts_query = res.scalars().all()

            for p in posts_query:
                author_name = None
                if p.author and p.author.profile:
                    fname = p.author.profile.first_name or ""
                    lname = p.author.profile.last_name or ""
                    author_name = f"{fname} {lname}".strip() or p.author.email
                elif p.author:
                    author_name = p.author.email

                posts_list.append(
                    PostSearchResult(
                        id=p.id,
                        content=p.content,
                        author_id=p.author_id,
                        author_name=author_name,
                        created_at=str(p.created_at),
                    )
                )

        # 3. Search Jobs
        if category_lower in ("all", "jobs"):
            stmt = (
                select(JobPosting)
                .outerjoin(Company, JobPosting.company_id == Company.id)
                .where(
                    or_(
                        JobPosting.title.ilike(search_pattern),
                        JobPosting.description.ilike(search_pattern),
                        JobPosting.location.ilike(search_pattern),
                        Company.name.ilike(search_pattern),
                    )
                )
                .options(selectinload(JobPosting.company))
                .limit(limit)
            )
            res = await self.db.execute(stmt)
            jobs_query = res.scalars().all()

            for j in jobs_query:
                company_name = j.company.name if j.company else None
                job_type_str = (
                    str(j.job_type.value)
                    if hasattr(j.job_type, "value")
                    else str(j.job_type)
                )
                jobs_list.append(
                    JobSearchResult(
                        id=j.id,
                        title=j.title,
                        company_name=company_name,
                        location=j.location,
                        job_type=job_type_str,
                    )
                )

        # 4. Search Events
        if category_lower in ("all", "events"):
            stmt = (
                select(Event)
                .where(
                    or_(
                        Event.title.ilike(search_pattern),
                        Event.description.ilike(search_pattern),
                        Event.location.ilike(search_pattern),
                    )
                )
                .limit(limit)
            )
            res = await self.db.execute(stmt)
            events_query = res.scalars().all()

            for e in events_query:
                events_list.append(
                    EventSearchResult(
                        id=e.id,
                        title=e.title,
                        description=e.description,
                        location=e.location,
                        start_datetime=str(e.start_datetime),
                    )
                )

        total_results = (
            len(users_list) + len(posts_list) + len(jobs_list) + len(events_list)
        )

        return GlobalSearchResponse(
            query=query,
            total_results=total_results,
            users=users_list,
            posts=posts_list,
            jobs=jobs_list,
            events=events_list,
        )
