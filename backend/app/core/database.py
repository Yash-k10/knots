from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# Create database engine
# For asyncpg connection pool we can set pooling attributes here
engine_args = {
    "echo": False,
    "future": True,
}

if settings.DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {
        "timeout": 30,
        "check_same_thread": False,
    }
else:
    engine_args["pool_size"] = 20
    engine_args["max_overflow"] = 10
    engine_args["pool_pre_ping"] = True
    engine_args["pool_recycle"] = 300
    engine_args["pool_timeout"] = 30
    engine_args["connect_args"] = {
        "statement_cache_size": 0,
        "timeout": 30,
        "command_timeout": 30,
    }

engine = create_async_engine(settings.DATABASE_URL, **engine_args)

# Create session factory
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Declarative base model
Base = declarative_base()


# Dependency to get db session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Provide a transactional database session per-request.

    The async context manager handles session lifecycle (open/close).
    On success the transaction is committed; on any exception it is rolled back.
    """
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
