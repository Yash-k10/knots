# Placeholder AI services for KNOTS final year project.
# These services are defined structurally to support future implementation.


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
