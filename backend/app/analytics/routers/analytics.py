from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
import io
import csv
from fastapi.responses import StreamingResponse
from app.analytics.schemas.analytics import (
    PlatformEngagementSummary,
    PostEngagementResponse,
    ProfileViewsResponse,
    SystemStats,
    TrendingPostResponse,
)
from app.analytics.services.analytics import AnalyticsService
from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/stats", response_model=APIResponse[SystemStats])
async def read_system_stats(db: AsyncSession = Depends(get_db)):
    """Retrieve system analytics metrics (user count, active jobs, etc.)."""
    service = AnalyticsService(db)
    stats = await service.get_system_stats()
    return APIResponse(data=stats)


@router.get(
    "/platform/engagement-summary",
    response_model=APIResponse[PlatformEngagementSummary],
)
async def read_platform_engagement_summary(db: AsyncSession = Depends(get_db)):
    """Retrieve aggregate engagement summary metrics across the entire platform."""
    service = AnalyticsService(db)
    summary = await service.get_platform_engagement_summary()
    return APIResponse(data=summary)


@router.get("/profile/views", response_model=APIResponse[ProfileViewsResponse])
async def read_profile_views(
    days: int = Query(7, ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve profile view counts for the current user's profile over the last N days."""
    service = AnalyticsService(db)
    history = await service.get_profile_views(current_user.id, days)
    return APIResponse(data=history)


@router.get("/posts/engagement", response_model=APIResponse[PostEngagementResponse])
async def read_posts_engagement(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve engagement metrics for posts created by the current user."""
    service = AnalyticsService(db)
    engagement = await service.get_posts_engagement(current_user.id)
    return APIResponse(data=engagement)


@router.get("/trending-posts", response_model=APIResponse[list[TrendingPostResponse]])
async def read_trending_posts(
    limit: int = Query(5, ge=1, le=20),
    days: int = Query(7, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve top trending posts across the platform based on weighted engagement."""
    service = AnalyticsService(db)
    trending = await service.get_trending_posts(limit=limit, days=days)
    return APIResponse(data=trending)


@router.post("/posts/{post_id}/view", response_model=APIResponse)
async def record_post_view(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    # Optional authentication to track authenticated views if needed
    # We can get current user or default to None if not logged in
):
    """Record a view on a post to track engagement metrics."""
    service = AnalyticsService(db)
    await service.record_post_view(post_id, user_id=None)
    return APIResponse(message="Post view recorded successfully")


@router.post("/profile/{profile_id}/view", response_model=APIResponse)
async def record_profile_view(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Record a view on a profile to track engagement metrics."""
    service = AnalyticsService(db)
    await service.record_profile_view(profile_id, viewer_id=None)
    return APIResponse(message="Profile view recorded successfully")


# ==============================================================================
# Prototype Generation for Dashboards (TPO / Central Admin)
# ==============================================================================

def generate_department_stats(dept: str):
    if dept == "All":
        base_val = 20
    else:
        base_val = len(dept) * 10
    return {
        "department": dept,
        "total_students": 100 + base_val * 5,
        "placed_students": 50 + base_val * 4,
        "highest_ctc": f"{10 + (base_val % 20)} LPA",
        "average_ctc": f"{4 + (base_val % 5)}.5 LPA",
        "active_recruiters": 5 + (base_val % 10)
    }

def generate_report_data(dept: str, report_type: str):
    if dept == "All":
        base_val = 25
    else:
        base_val = len(dept) * 5
        
    if report_type == "placement":
        return [
            {"Company": "Tech Corp", "Role": "SDE", "Offers": base_val, "CTC": "12 LPA"},
            {"Company": "Innovate LLC", "Role": "Analyst", "Offers": base_val + 2, "CTC": "8 LPA"}
        ]
    elif report_type == "academic":
        return [
            {"Batch": "2024", "Avg_CGPA": 8.1 + (base_val % 10)/100, "Pass_Percentage": "95%"},
            {"Batch": "2025", "Avg_CGPA": 7.9 + (base_val % 10)/100, "Pass_Percentage": "92%"}
        ]
    elif report_type == "activity":
        return [
            {"Event_Type": "Technical", "Count": 10 + base_val, "Participants": 150 + base_val * 10},
            {"Event_Type": "Cultural", "Count": 5 + base_val, "Participants": 200 + base_val * 5}
        ]
    elif report_type == "alumni":
        return [
            {"Location": "India", "Count": 500 + base_val * 20, "Mentors": 50 + base_val},
            {"Location": "Abroad", "Count": 100 + base_val * 5, "Mentors": 10 + base_val}
        ]
    return []

@router.get("/department-stats")
async def get_department_stats(department: str = Query("All")):
    """Get prototype dashboard statistics dynamically generated based on the selected department."""
    stats = generate_department_stats(department)
    return APIResponse(data=stats)

@router.get("/reports")
async def get_department_reports(
    type: str = Query(..., description="Report type: placement, academic, activity, alumni"),
    department: str = Query("All")
):
    """Get dynamic report data generated based on department."""
    data = generate_report_data(department, type)
    return APIResponse(data=data)

@router.get("/reports/export")
async def export_department_reports(
    type: str = Query(..., description="Report type: placement, academic, activity, alumni"),
    department: str = Query("All")
):
    """Generate and stream a CSV (Excel compatible) report based on department."""
    data = generate_report_data(department, type)
    
    if not data:
        data = [{"Message": "No data available"}]
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
    
    output.seek(0)
    
    filename = f"{department}_{type}_report.csv".lower().replace(" ", "_")
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
