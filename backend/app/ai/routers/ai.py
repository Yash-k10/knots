from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.schemas.connection_suggestion import ConnectionSuggestionResponse
from app.ai.services.ai import (
    AIConnectionSuggestionService,
    AIResumeService,
    CareerRoadmapService,
)
from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User

router = APIRouter(prefix="/ai", tags=["AI Integration"])


class ResumeRequest(BaseModel):
    resume_text: str


class RoadmapRequest(BaseModel):
    target_role: str
    current_skills: list[str]


@router.post("/analyze-resume", response_model=APIResponse[dict])
async def analyze_resume(payload: ResumeRequest):
    """Analyze resume text and return optimization feedback (Placeholder)."""
    service = AIResumeService()
    result = await service.analyze_resume(payload.resume_text)
    return APIResponse(message="Resume analysis completed (sandbox)", data=result)


@router.post("/roadmap", response_model=APIResponse[dict])
async def generate_roadmap(payload: RoadmapRequest):
    """Generate skill learning step roadmap (Placeholder)."""
    service = CareerRoadmapService()
    result = await service.generate_roadmap(payload.target_role, payload.current_skills)
    return APIResponse(message="Roadmap generated successfully (sandbox)", data=result)


@router.get(
    "/connection-suggestions",
    response_model=APIResponse[list[ConnectionSuggestionResponse]],
)
async def get_connection_suggestions(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get AI-powered connection suggestions based on skills, department, and graduation year."""
    service = AIConnectionSuggestionService()
    suggestions = await service.get_connection_suggestions(
        db=db, current_user_id=current_user.id, limit=limit
    )
    return APIResponse(
        message="AI connection suggestions retrieved successfully", data=suggestions
    )
