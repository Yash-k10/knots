from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# Create database engine
# For asyncpg connection pool we can set pooling attributes here
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True if settings.ENVIRONMENT == "development" else False,
    future=True,
    pool_size=20,
    max_overflow=10,
)

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
