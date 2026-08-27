# Placeholder AI services for KNOTS final year project.
# These services are defined structurally to support future implementation.

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.schemas.connection_suggestion import ConnectionSuggestionResponse
from app.ai.schemas.content_recommendation import ContentRecommendationResponse
from app.ai.schemas.job_recommendation import JobRecommendationResponse
from app.connections.models.connection import Connection
from app.jobs.models.application import Application
from app.jobs.models.enums import JobStatusEnum
from app.jobs.models.job_posting import JobPosting
from app.posts.models.post import Post, PostVisibility
from app.profiles.models.profile import Profile
from app.users.models.role import Role
from app.users.models.user import User


class AIResumeService:
    """Service to parse, critique, and optimize student resumes using LLMs."""

    async def analyze_resume(self, resume_text: str) -> dict:
        return {
            "score": 85,
            "feedback": "Resume parsing is currently in sandbox mode.",
            "suggestions": [
                "Add more metrics to experience",
                "Incorporate skill keywords",
            ],
        }


class AIClubRecommendationService:
    """Service to recommend campus clubs to users based on interest vectors."""

    async def get_recommended_clubs(self, user_id: int) -> list[int]:
        return []


class AIModerationService:
    """Service to moderate text content (posts, comments) to filter abuse/profanity."""

    async def moderate_content(self, text: str) -> bool:
        return True


class AIAlumniMatcher:
    """Service to match students with alumni mentors based on career trajectories."""

    async def find_mentors(self, student_id: int) -> list[dict]:
        return []


class CareerRoadmapService:
    """Service to generate step-by-step career roadmaps mapping skills gaps to roles."""

    async def generate_roadmap(
        self, target_role: str, current_skills: list[str]
    ) -> dict:
        return {
            "role": target_role,
            "steps": [
                "Scaffolded learning path placeholder. AI engine pending integration."
            ],
        }


class AIConnectionSuggestionService:
    """AI-powered connection suggestions service based on skills, department, and graduation year."""

    async def get_connection_suggestions(
        self, db: AsyncSession, current_user_id: int, limit: int = 10
    ) -> list[ConnectionSuggestionResponse]:
        stmt = select(Profile).where(Profile.user_id == current_user_id)
        res = await db.execute(stmt)
        current_profile = res.scalars().first()

        conn_stmt = select(Connection).where(
            or_(
                Connection.requester_id == current_user_id,
                Connection.addressee_id == current_user_id,
            )
        )
        conn_res = await db.execute(conn_stmt)
        existing_connections = conn_res.scalars().all()

        excluded_ids = {current_user_id}
        for conn in existing_connections:
            excluded_ids.add(conn.requester_id)
            excluded_ids.add(conn.addressee_id)

        cand_stmt = (
            select(User)
            .outerjoin(Profile, User.id == Profile.user_id)
            .outerjoin(Role, User.role_id == Role.id)
            .options(selectinload(User.role), selectinload(User.profile))
            .where(
                and_(
                    User.is_active == True,
                    User.id.notin_(excluded_ids),
                    or_(
                        Role.name.is_(None),
                        and_(
                            Role.name != "Super Admin",
                            Role.name != "super admin",
                            Role.name != "superadmin",
                            Role.name != "SUPER ADMIN",
                        ),
                    ),
                )
            )
        )
        cand_res = await db.execute(cand_stmt)
        candidates = cand_res.scalars().all()

        user_skills: list[str] = []
        user_dept = current_profile.department if current_profile else None
        user_grad_year = current_profile.graduation_year if current_profile else None

        if current_profile and current_profile.skills:
            if isinstance(current_profile.skills, list):
                user_skills = [str(s).strip() for s in current_profile.skills]
            elif isinstance(current_profile.skills, dict):
                for val in current_profile.skills.values():
                    if isinstance(val, list):
                        user_skills.extend([str(s).strip() for s in val])

        user_skills_lower = {s.lower(): s for s in user_skills}
        suggestions: list[ConnectionSuggestionResponse] = []

        for user in candidates:
            profile = user.profile
            cand_skills: list[str] = []
            if profile and profile.skills:
                if isinstance(profile.skills, list):
                    cand_skills = [str(s).strip() for s in profile.skills]
                elif isinstance(profile.skills, dict):
                    for val in profile.skills.values():
                        if isinstance(val, list):
                            cand_skills.extend([str(s).strip() for s in val])

            common_skills: list[str] = []
            for s in cand_skills:
                if s.lower() in user_skills_lower:
                    if s not in common_skills:
                        common_skills.append(s)

            score = 40
            reasons: list[str] = []

            cand_dept = profile.department if profile else None
            cand_grad_year = profile.graduation_year if profile else None
            cand_bio = profile.bio if profile else None
            cand_picture = profile.profile_picture if profile else None

            if (
                user_dept
                and cand_dept
                and user_dept.strip().lower() == cand_dept.strip().lower()
            ):
                score += 30
                reasons.append(f"Matching department: {cand_dept}")
            elif cand_dept:
                reasons.append(f"Department: {cand_dept}")

            if common_skills:
                skill_points = min(len(common_skills) * 10, 30)
                score += skill_points
                skills_str = ", ".join(common_skills[:3])
                reasons.append(
                    f"{len(common_skills)} shared skill{'s' if len(common_skills) > 1 else ''} ({skills_str})"
                )

            if user_grad_year and cand_grad_year:
                year_diff = abs(user_grad_year - cand_grad_year)
                if year_diff == 0:
                    score += 10
                    reasons.append(f"Same graduation year ({cand_grad_year})")
                elif year_diff == 1:
                    score += 5

            score = min(score, 98)
            reason_text = (
                " | ".join(reasons)
                if reasons
                else f"Recommended {user.role.name if user.role else 'campus peer'}"
            )

            clean_first = profile.first_name if profile else None
            clean_last = profile.last_name if profile else None
            if not clean_first or clean_first.strip().lower() == "user":
                email_handle = user.email.split("@")[0]
                parts = [
                    p.capitalize()
                    for p in email_handle.replace("_", ".").split(".")
                    if p
                ]
                clean_first = parts[0] if parts else "Student"
                clean_last = (
                    " ".join(parts[1:]) if len(parts) > 1 else (clean_last or "")
                )

            suggestions.append(
                ConnectionSuggestionResponse(
                    user_id=user.id,
                    email=user.email,
                    first_name=clean_first,
                    last_name=clean_last or "",
                    bio=cand_bio,
                    department=cand_dept
                    or (user.role.name if user.role else "Student"),
                    graduation_year=cand_grad_year,
                    profile_picture=cand_picture,
                    skills=cand_skills,
                    match_score=score,
                    common_skills=common_skills,
                    reason=reason_text,
                )
            )

        suggestions.sort(key=lambda x: x.match_score, reverse=True)
        return suggestions[:limit]


class AIJobRecommendationService:
    """AI-powered job recommendations service based on user skills, department, and career details."""

    async def get_job_recommendations(
        self, db: AsyncSession, current_user_id: int, limit: int = 10
    ) -> list[JobRecommendationResponse]:
        stmt = select(Profile).where(Profile.user_id == current_user_id)
        res = await db.execute(stmt)
        current_profile = res.scalars().first()

        user_skills: list[str] = []
        user_dept = current_profile.department if current_profile else None

        if current_profile and current_profile.skills:
            if isinstance(current_profile.skills, list):
                user_skills = [str(s).strip() for s in current_profile.skills]
            elif isinstance(current_profile.skills, dict):
                for val in current_profile.skills.values():
                    if isinstance(val, list):
                        user_skills.extend([str(s).strip() for s in val])

        user_skills_lower = {s.lower(): s for s in user_skills}

        app_stmt = select(Application.job_posting_id).where(
            Application.applicant_id == current_user_id
        )
        app_res = await db.execute(app_stmt)
        applied_job_ids = set(app_res.scalars().all())

        job_stmt = (
            select(JobPosting)
            .options(selectinload(JobPosting.company))
            .where(
                and_(
                    JobPosting.status == JobStatusEnum.OPEN,
                    JobPosting.id.notin_(applied_job_ids) if applied_job_ids else True,
                )
            )
        )
        job_res = await db.execute(job_stmt)
        jobs = job_res.scalars().all()

        recommendations: list[JobRecommendationResponse] = []

        for job in jobs:
            req_skills: list[str] = []
            if job.required_skills:
                if isinstance(job.required_skills, list):
                    req_skills = [str(s).strip() for s in job.required_skills]
                elif isinstance(job.required_skills, dict):
                    for val in job.required_skills.values():
                        if isinstance(val, list):
                            req_skills.extend([str(s).strip() for s in val])

            matching_skills: list[str] = []
            for s in req_skills:
                if s.lower() in user_skills_lower:
                    if s not in matching_skills:
                        matching_skills.append(s)

            score = 40
            reasons: list[str] = []

            if matching_skills:
                skill_points = min(len(matching_skills) * 15, 45)
                score += skill_points
                skills_str = ", ".join(matching_skills[:3])
                reasons.append(
                    f"{len(matching_skills)} matching skill{'s' if len(matching_skills) > 1 else ''} ({skills_str})"
                )

            title_desc_lower = f"{job.title} {job.description or ''}".lower()
            if user_dept and user_dept.strip().lower() in title_desc_lower:
                score += 15
                reasons.append(f"Relevant to department: {user_dept}")

            score = min(score, 98)
            reason_text = (
                " | ".join(reasons)
                if reasons
                else "Recommended based on open position requirements"
            )

            job_type_val = (
                job.job_type.value
                if hasattr(job.job_type, "value")
                else str(job.job_type)
            )
            workplace_val = (
                job.workplace_type.value
                if hasattr(job.workplace_type, "value")
                else str(job.workplace_type)
            )
            company_name = job.company.name if job.company else None

            recommendations.append(
                JobRecommendationResponse(
                    job_id=job.id,
                    title=job.title,
                    company_name=company_name,
                    location=job.location,
                    job_type=job_type_val,
                    workplace_type=workplace_val,
                    salary_range=job.salary_range,
                    required_skills=req_skills,
                    match_score=score,
                    matching_skills=matching_skills,
                    reason=reason_text,
                )
            )

        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        return recommendations[:limit]


class AIContentRecommendationService:
    """AI-powered content recommendations for feed based on user interest & engagement metrics."""

    async def get_content_recommendations(
        self, db: AsyncSession, current_user_id: int, limit: int = 10
    ) -> list[ContentRecommendationResponse]:
        stmt = select(Profile).where(Profile.user_id == current_user_id)
        res = await db.execute(stmt)
        current_profile = res.scalars().first()

        user_skills: list[str] = []
        user_dept = current_profile.department if current_profile else None

        if current_profile and current_profile.skills:
            if isinstance(current_profile.skills, list):
                user_skills = [str(s).strip() for s in current_profile.skills]
            elif isinstance(current_profile.skills, dict):
                for val in current_profile.skills.values():
                    if isinstance(val, list):
                        user_skills.extend([str(s).strip() for s in val])

        search_topics = set()
        for s in user_skills:
            if len(s) > 2:
                search_topics.add(s.lower())
        if user_dept:
            search_topics.add(user_dept.lower())

        post_stmt = (
            select(Post)
            .options(
                selectinload(Post.author).selectinload(User.profile),
                selectinload(Post.likes),
                selectinload(Post.comments),
            )
            .where(Post.visibility == PostVisibility.PUBLIC)
        )
        post_res = await db.execute(post_stmt)
        posts = post_res.scalars().all()

        recommendations: list[ContentRecommendationResponse] = []

        for post in posts:
            content_lower = post.content.lower()
            matched_topics: list[str] = []

            for topic in search_topics:
                if topic in content_lower:
                    matched_topics.append(topic.capitalize())

            score = 35
            reasons: list[str] = []

            if matched_topics:
                topic_points = min(len(matched_topics) * 20, 40)
                score += topic_points
                topics_str = ", ".join(matched_topics[:3])
                reasons.append(f"Matches interests: {topics_str}")

            like_count = len(post.likes) if post.likes else 0
            comment_count = len(post.comments) if post.comments else 0

            if like_count + comment_count >= 3:
                score += 15
                reasons.append("High community engagement")
            elif like_count + comment_count > 0:
                score += 5

            score = min(score, 98)
            reason_text = (
                " | ".join(reasons)
                if reasons
                else "Recommended trending campus content"
            )

            author_name = None
            author_avatar = None
            if post.author and post.author.profile:
                p = post.author.profile
                author_name = f"{p.first_name or ''} {p.last_name or ''}".strip()
                if not author_name:
                    author_name = post.author.email.split("@")[0]
                author_avatar = p.profile_picture

            created_at_str = post.created_at.isoformat() if post.created_at else None

            recommendations.append(
                ContentRecommendationResponse(
                    post_id=post.id,
                    author_id=post.author_id,
                    author_name=author_name,
                    author_avatar=author_avatar,
                    content=post.content,
                    image_url=post.image_url,
                    created_at=created_at_str,
                    like_count=like_count,
                    comment_count=comment_count,
                    relevance_score=score,
                    matched_topics=matched_topics,
                    reason=reason_text,
                )
            )

        recommendations.sort(key=lambda x: x.relevance_score, reverse=True)
        return recommendations[:limit]
