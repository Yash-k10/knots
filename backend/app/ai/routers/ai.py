from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User
from app.ai.schemas.ai import (
    ResumeRequest,
    ResumeAnalysisResponse,
    RoadmapRequest,
    RoadmapResponse,
    ConnectionRecommendation,
    JobRecommendation,
    PostRecommendation,
    AIRecommendationsResponse,
)
from app.ai.services.ai import (
    AIResumeService,
    CareerRoadmapService,
    AIRecommendationService,
)

router = APIRouter(prefix="/ai", tags=["AI Integration & Recommendations"])


@router.post("/analyze-resume", response_model=APIResponse[ResumeAnalysisResponse])
async def analyze_resume(payload: ResumeRequest):
    """Analyze resume text and return optimization feedback and ATS score."""
    service = AIResumeService()
    result = await service.analyze_resume(payload.resume_text)
    return APIResponse(
        message="Resume analysis completed successfully",
        data=ResumeAnalysisResponse(**result),
    )


@router.post("/roadmap", response_model=APIResponse[RoadmapResponse])
async def generate_roadmap(payload: RoadmapRequest):
    """Generate a sequential skill-learning roadmap for a target career role."""
    service = CareerRoadmapService()
    result = await service.generate_roadmap(payload.target_role, payload.current_skills)
    return APIResponse(
        message="Career roadmap generated successfully",
        data=RoadmapResponse(**result),
    )


@router.get(
    "/recommendations/connections",
    response_model=APIResponse[List[ConnectionRecommendation]],
)
async def get_connection_recommendations(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get AI-powered peer and alumni connection suggestions based on skills and department."""
    service = AIRecommendationService(db)
    results = await service.get_recommended_connections(current_user.id, limit=limit)
    return APIResponse(
        message="Connection recommendations retrieved successfully",
        data=results,
    )


@router.get(
    "/recommendations/jobs", response_model=APIResponse[List[JobRecommendation]]
)
async def get_job_recommendations(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get AI-powered job matches based on user skill profile and requirements."""
    service = AIRecommendationService(db)
    results = await service.get_recommended_jobs(current_user.id, limit=limit)
    return APIResponse(
        message="Job recommendations retrieved successfully",
        data=results,
    )


@router.get(
    "/recommendations/posts", response_model=APIResponse[List[PostRecommendation]]
)
async def get_post_recommendations(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get AI-powered campus discussion and post recommendations."""
    service = AIRecommendationService(db)
    results = await service.get_recommended_posts(current_user.id, limit=limit)
    return APIResponse(
        message="Post recommendations retrieved successfully",
        data=results,
    )


@router.get("/recommendations", response_model=APIResponse[AIRecommendationsResponse])
async def get_all_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get comprehensive AI recommendations for connections, jobs, and posts (Dashboard widget)."""
    service = AIRecommendationService(db)
    results = await service.get_all_recommendations(current_user.id)
    return APIResponse(
        message="AI recommendations retrieved successfully",
        data=results,
    )
