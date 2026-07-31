import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

import app.core.base
from app.api_router import v1_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.middleware import register_middlewares

# Define OpenAPI metadata tags for domain-driven documentation
openapi_tags = [
    {
        "name": "Profiles",
        "description": "User profile management, education history, employment experience, profile picture upload, and peer skill endorsements.",
    },
    {
        "name": "Jobs",
        "description": "Job and internship postings, company directory, student job applications, and referral requests.",
    },
    {
        "name": "Analytics",
        "description": "Platform-wide engagement statistics, profile view analytics, post engagement metrics, and trending algorithm data.",
    },
    {
        "name": "Auth",
        "description": "Authentication and authorization endpoints including JWT register, login, refresh, logout, and verification.",
    },
    {
        "name": "Users",
        "description": "User account management, role administration, and security settings.",
    },
    {
        "name": "Posts",
        "description": "Social feed posts, media attachments, likes, and comment threads.",
    },
    {
        "name": "Connections",
        "description": "Student networking, connection requests, mutual connections, and peer recommendations.",
    },
    {
        "name": "Messaging",
        "description": "Direct messaging, conversation threads, and real-time chat history.",
    },
    {
        "name": "Events",
        "description": "Campus event scheduling, categories, RSVP tracking, and attendee lists.",
    },
    {
        "name": "Clubs",
        "description": "Student club organizations, member directories, and announcements.",
    },
    {
        "name": "Notifications",
        "description": "Real-time user alerts, badge counters, and notification preferences.",
    },
    {
        "name": "AI",
        "description": "AI-powered recommendations for job matching, feed personalization, and connection suggestions.",
    },
    {
        "name": "Search",
        "description": "Global search across users, posts, jobs, events, and clubs.",
    },
    {
        "name": "Admin",
        "description": "Platform moderation, system metrics, and RBAC administrative controls.",
    },
    {
        "name": "Health Check",
        "description": "System health and operational status probes.",
    },
]

# Initialize FastAPI Application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered community-based career and collaboration platform for colleges",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=openapi_tags,
)

# Register Custom Middlewares (CORS, Audit logs, Profiling)
register_middlewares(app)

# Register Exception Handlers (Standardizing all error responses)
register_exception_handlers(app)

# Mount static files directory to serve uploads (like profile pictures)
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount versioned API routes under /api/v1
app.include_router(v1_router, prefix="/api/v1")


@app.get("/", tags=["Health Check"])
async def root():
    """Application level health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }
