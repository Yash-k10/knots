import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.middleware import register_middlewares
from app.api_router import v1_router

# Initialize FastAPI Application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered community-based career and collaboration platform for colleges",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
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
