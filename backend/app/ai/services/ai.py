from typing import List, Dict, Any
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.profiles.models.profile import Profile
from app.jobs.models.job_posting import JobPosting, JobStatusEnum
from app.posts.models.post import Post
from app.ai.schemas.ai import (
    ConnectionRecommendation,
    JobRecommendation,
    PostRecommendation,
    AIRecommendationsResponse,
)


def _extract_skills_list(skills_field: Any) -> List[str]:
    """Helper to normalize skills field (can be JSON list of strings, list of dicts, or None) to lowercased strings."""
    if not skills_field:
        return []
    result = []
    if isinstance(skills_field, list):
        for item in skills_field:
            if isinstance(item, str):
                result.append(item.strip().lower())
            elif isinstance(item, dict) and "name" in item:
                result.append(str(item["name"]).strip().lower())
    return result


class AIResumeService:
    """Service to parse, critique, and optimize student resumes using AI heuristics and NLP."""

    async def analyze_resume(self, resume_text: str) -> Dict[str, Any]:
        text_lower = resume_text.lower()
        score = 70
        suggestions = []
        feedback_items = []

        keywords = [
            "python",
            "javascript",
            "react",
            "sql",
            "fastapi",
            "docker",
            "git",
            "machine learning",
            "data",
            "api",
        ]
        found_keywords = [kw for kw in keywords if kw in text_lower]

        if len(found_keywords) >= 5:
            score += 15
            feedback_items.append("Strong technical skill diversity detected.")
        elif len(found_keywords) >= 2:
            score += 8
            suggestions.append(
                "Consider listing more relevant technical frameworks and tools."
            )
        else:
            suggestions.append(
                "Add key industry technical terms (e.g. Python, SQL, Git, API) to improve ATS matching."
            )

        if (
            "experience" in text_lower
            or "internship" in text_lower
            or "project" in text_lower
        ):
            score += 10
            feedback_items.append("Includes project/internship experience sections.")
        else:
            suggestions.append(
                "Highlight specific academic projects or internships with measurable outcomes."
            )

        if (
            "%" not in resume_text
            and "$" not in resume_text
            and not any(char.isdigit() for char in resume_text)
        ):
            suggestions.append(
                "Use quantifiable metrics (e.g., 'improved performance by 25%') in experience bullet points."
            )
        else:
            score += 5

        score = min(score, 98)
        feedback = (
            " ".join(feedback_items)
            if feedback_items
            else "Solid foundation. Focus on adding quantifiable results and targeted keywords."
        )

        return {
            "score": score,
            "feedback": feedback,
            "suggestions": (
                suggestions
                if suggestions
                else ["Your resume is well-structured and ATS-ready!"]
            ),
        }


class CareerRoadmapService:
    """Service to generate step-by-step career roadmaps mapping skills gaps to roles."""

    async def generate_roadmap(
        self, target_role: str, current_skills: List[str]
    ) -> Dict[str, Any]:
        role_lower = target_role.lower()
        current_set = {s.lower() for s in current_skills}

        steps = []
        if (
            "backend" in role_lower
            or "software" in role_lower
            or "engineer" in role_lower
        ):
            steps = [
                "Step 1: Master core language syntax and Object-Oriented Programming (Python/TS)",
                "Step 2: Learn REST API design, database modeling (SQL/PostgreSQL), and ORMs (SQLAlchemy)",
                "Step 3: Gain proficiency in containerization (Docker) and CI/CD pipelines",
                "Step 4: Build scalable full-stack projects and contribute to open source",
            ]
        elif (
            "data" in role_lower
            or "ai" in role_lower
            or "machine learning" in role_lower
        ):
            steps = [
                "Step 1: Strong foundation in Linear Algebra, Statistics, and Python (NumPy/Pandas)",
                "Step 2: Practical Machine Learning with Scikit-Learn and model evaluation metrics",
                "Step 3: Deep Learning frameworks (PyTorch/TensorFlow) and NLP/Computer Vision models",
                "Step 4: Deploy AI models via FastAPI microservices and Docker containers",
            ]
        else:
            steps = [
                f"Step 1: Research core foundational competencies for {target_role}",
                "Step 2: Complete practical certifications and hands-on portfolio projects",
                "Step 3: Network with industry professionals and campus alumni mentors",
                "Step 4: Prepare tailored resumes and conduct mock technical interviews",
            ]

        if current_set:
            steps.append(
                f"Step 5: Leverage your existing strengths ({', '.join(current_skills[:3])}) to accelerate projects."
            )

        return {
            "role": target_role,
            "steps": steps,
        }


class AIRecommendationService:
    """AI engine for smart connection suggestions, job matching, and feed recommendations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_recommended_connections(
        self, user_id: int, limit: int = 5
    ) -> List[ConnectionRecommendation]:
        # 1. Fetch current user's profile
        user_prof_res = await self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        )
        user_profile = user_prof_res.scalar_one_or_none()
        user_dept = user_profile.department if user_profile else None
        user_grad = user_profile.graduation_year if user_profile else None
        user_skills = set(
            _extract_skills_list(user_profile.skills if user_profile else None)
        )

        # 2. Fetch candidate profiles (exclude current user)
        candidates_res = await self.db.execute(
            select(Profile).where(Profile.user_id != user_id)
        )
        candidates = candidates_res.scalars().all()

        recommendations = []
        for cand in candidates:
            score = 60
            reasons = []
            cand_skills = set(_extract_skills_list(cand.skills))
            shared_skills = list(user_skills.intersection(cand_skills))

            if (
                user_dept
                and cand.department
                and user_dept.lower() == cand.department.lower()
            ):
                score += 20
                reasons.append(f"Same department ({cand.department})")

            if user_grad and cand.graduation_year and user_grad == cand.graduation_year:
                score += 10
                reasons.append(f"Class of {cand.graduation_year}")

            if shared_skills:
                score += min(len(shared_skills) * 8, 25)
                reasons.append(
                    f"Shared skills: {', '.join([s.title() for s in shared_skills[:3]])}"
                )

            if not reasons:
                reasons.append("Active campus community member")

            recommendations.append(
                ConnectionRecommendation(
                    user_id=cand.user_id,
                    first_name=cand.first_name,
                    last_name=cand.last_name,
                    department=cand.department,
                    graduation_year=cand.graduation_year,
                    bio=cand.bio,
                    match_score=min(score, 99),
                    match_reasons=reasons,
                    shared_skills=[s.title() for s in shared_skills],
                )
            )

        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        return recommendations[:limit]

    async def get_recommended_jobs(
        self, user_id: int, limit: int = 5
    ) -> List[JobRecommendation]:
        # 1. Fetch current user's profile skills
        user_prof_res = await self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        )
        user_profile = user_prof_res.scalar_one_or_none()
        user_skills = set(
            _extract_skills_list(user_profile.skills if user_profile else None)
        )

        # 2. Fetch open job postings
        jobs_res = await self.db.execute(
            select(JobPosting)
            .options(selectinload(JobPosting.company))
            .where(JobPosting.status == JobStatusEnum.OPEN)
        )
        jobs = jobs_res.scalars().all()

        recommendations = []
        for job in jobs:
            score = 65
            reasons = []
            req_skills = set(_extract_skills_list(job.required_skills))
            matching = list(user_skills.intersection(req_skills))

            if matching:
                score += min(len(matching) * 12, 30)
                reasons.append(f"Matches {len(matching)} of your skills")
            elif user_profile and user_profile.department:
                score += 10
                reasons.append(f"Relevant to {user_profile.department} students")
            else:
                reasons.append("High-demand campus opportunity")

            if job.job_type:
                reasons.append(
                    str(
                        job.job_type.value
                        if hasattr(job.job_type, "value")
                        else job.job_type
                    )
                )

            recommendations.append(
                JobRecommendation(
                    job_id=job.id,
                    title=job.title,
                    company_name=job.company.name if job.company else "Campus Partner",
                    location=job.location,
                    job_type=str(
                        job.job_type.value
                        if hasattr(job.job_type, "value")
                        else job.job_type
                    ),
                    match_score=min(score, 98),
                    match_reasons=reasons,
                    matching_skills=[s.title() for s in matching],
                )
            )

        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        return recommendations[:limit]

    async def get_recommended_posts(
        self, user_id: int, limit: int = 5
    ) -> List[PostRecommendation]:
        posts_res = await self.db.execute(
            select(Post)
            .options(
                selectinload(Post.author),
                selectinload(Post.likes),
                selectinload(Post.comments),
            )
            .where(Post.author_id != user_id)
            .order_by(Post.created_at.desc())
            .limit(20)
        )
        posts = posts_res.scalars().all()

        recommendations = []
        for post in posts:
            likes_count = len(post.likes) if post.likes else 0
            comments_count = len(post.comments) if post.comments else 0
            score = 70 + min(likes_count * 3 + comments_count * 5, 25)

            snippet = (
                post.content[:120] + "..." if len(post.content) > 120 else post.content
            )
            author_name = "Campus Member"
            if post.author:
                author_name = f"{post.author.email.split('@')[0].title()}"

            reason = (
                "Trending campus discussion"
                if (likes_count + comments_count) > 2
                else "Recent campus update"
            )

            recommendations.append(
                PostRecommendation(
                    post_id=post.id,
                    author_id=post.author_id,
                    author_name=author_name,
                    content_snippet=snippet,
                    likes_count=likes_count,
                    comments_count=comments_count,
                    match_score=min(score, 99),
                    match_reason=reason,
                )
            )

        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        return recommendations[:limit]

    async def get_all_recommendations(self, user_id: int) -> AIRecommendationsResponse:
        connections = await self.get_recommended_connections(user_id, limit=4)
        jobs = await self.get_recommended_jobs(user_id, limit=4)
        posts = await self.get_recommended_posts(user_id, limit=4)

        return AIRecommendationsResponse(
            connections=connections,
            jobs=jobs,
            posts=posts,
        )
