from fastapi import APIRouter

# Import sub-routers from each domain-driven module
from app.auth.routers.auth import router as auth_router
from app.users.routers.user import router as users_router
from app.profiles.routers.profile import router as profiles_router
from app.posts.routers.post import router as posts_router
from app.connections.routers.connection import router as connections_router
from app.messaging.routers.message import router as messaging_router
from app.jobs.routers.job import router as jobs_router
from app.events.routers.event import router as events_router
from app.clubs.routers.club import router as clubs_router
from app.notifications.routers.notification import router as notifications_router
from app.admin.routers.admin import router as admin_router
from app.ai.routers.ai import router as ai_router
from app.analytics.routers.analytics import router as analytics_router

# Aggregated v1 API Router
v1_router = APIRouter()

v1_router.include_router(auth_router)
v1_router.include_router(users_router)
v1_router.include_router(profiles_router)
v1_router.include_router(posts_router)
v1_router.include_router(connections_router)
v1_router.include_router(messaging_router)
v1_router.include_router(jobs_router)
v1_router.include_router(events_router)
v1_router.include_router(clubs_router)
v1_router.include_router(notifications_router)
v1_router.include_router(admin_router)
v1_router.include_router(ai_router)
v1_router.include_router(analytics_router)
