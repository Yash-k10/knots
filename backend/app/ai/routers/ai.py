from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from app.ai.services.ai import AIResumeService, CareerRoadmapService
from app.core.response_models import APIResponse

router = APIRouter(prefix="/ai", tags=["AI Integration"])


class ResumeRequest(BaseModel):
    resume_text: str


class RoadmapRequest(BaseModel):
    target_role: str
    current_skills: List[str]


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
