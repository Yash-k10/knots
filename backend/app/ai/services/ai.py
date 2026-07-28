# Placeholder AI services for KNOTS final year project.
# These services are defined structurally to support future implementation.

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.schemas.connection_suggestion import ConnectionSuggestionResponse
from app.connections.models.connection import Connection
from app.profiles.models.profile import Profile
from app.users.models.user import User


class AIResumeService:
    """Service to parse, critique, and optimize student resumes using LLMs."""

    async def analyze_resume(self, resume_text: str) -> dict:
        # TODO: Integrate with OpenAI-compatible APIs or LangChain
        # TODO: Perform keyword extraction and alignment with Jobs schema
        # TODO: Return structured JSON feedback for sections (skills, experience, etc.)
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
        # TODO: Load user interests and profile vectors
        # TODO: Compute cosine similarity against club descriptions
        # TODO: Return Top-5 recommended club IDs
        return []


class AIModerationService:
    """Service to moderate text content (posts, comments) to filter abuse/profanity."""

    async def moderate_content(self, text: str) -> bool:
        # TODO: Perform toxicity checks using local Sentence Transformers or moderation APIs
        # TODO: Flag potential violations for placement officers and admin audit logs
        return True  # True means content is clean and approved


class AIAlumniMatcher:
    """Service to match students with alumni mentors based on career trajectories."""

    async def find_mentors(self, student_id: int) -> list[dict]:
        # TODO: Build user-profile embeddings
        # TODO: Index embeddings in FAISS vector database
        # TODO: Perform similarity search for matching career paths
        return []


class CareerRoadmapService:
    """Service to generate step-by-step career roadmaps mapping skills gaps to roles."""

    async def generate_roadmap(
        self, target_role: str, current_skills: list[str]
    ) -> dict:
        # TODO: Construct agentic LangChain workflow to research job skill requirements
        # TODO: Outline sequential timeline, courses, and certifications needed
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
        # 1. Fetch current user's profile
        stmt = select(Profile).where(Profile.user_id == current_user_id)
        res = await db.execute(stmt)
        current_profile = res.scalars().first()

        # 2. Fetch existing connection records involving current_user_id
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

        # 3. Query candidate profiles
        cand_stmt = (
            select(Profile, User)
            .join(User, Profile.user_id == User.id)
            .where(and_(User.is_active == True, Profile.user_id.notin_(excluded_ids)))
        )
        cand_res = await db.execute(cand_stmt)
        candidates = cand_res.all()

        # 4. Extract current user's details & skills
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

        # 5. Compute match scores
        suggestions: list[ConnectionSuggestionResponse] = []

        for profile, user in candidates:
            cand_skills: list[str] = []
            if profile.skills:
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

            score = 40  # Base match score
            reasons: list[str] = []

            # Department match check
            if (
                user_dept
                and profile.department
                and user_dept.strip().lower() == profile.department.strip().lower()
            ):
                score += 30
                reasons.append(f"Matching department: {profile.department}")
            elif profile.department:
                reasons.append(f"Department: {profile.department}")

            # Skill match check
            if common_skills:
                skill_points = min(len(common_skills) * 10, 30)
                score += skill_points
                skills_str = ", ".join(common_skills[:3])
                reasons.append(
                    f"{len(common_skills)} shared skill{'s' if len(common_skills) > 1 else ''} ({skills_str})"
                )

            # Graduation year proximity
            if user_grad_year and profile.graduation_year:
                year_diff = abs(user_grad_year - profile.graduation_year)
                if year_diff == 0:
                    score += 10
                    reasons.append(f"Same graduation year ({profile.graduation_year})")
                elif year_diff == 1:
                    score += 5

            score = min(score, 98)
            reason_text = (
                " | ".join(reasons) if reasons else "Suggested based on profile details"
            )

            suggestions.append(
                ConnectionSuggestionResponse(
                    user_id=profile.user_id,
                    first_name=profile.first_name,
                    last_name=profile.last_name,
                    bio=profile.bio,
                    department=profile.department,
                    graduation_year=profile.graduation_year,
                    profile_picture=profile.profile_picture,
                    skills=cand_skills,
                    match_score=score,
                    common_skills=common_skills,
                    reason=reason_text,
                )
            )

        # Sort suggestions by match_score descending
        suggestions.sort(key=lambda x: x.match_score, reverse=True)
        return suggestions[:limit]
