from typing import Any, Generic, List, Optional, Type, TypeVar
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """
    Generic Base Repository pattern for database entities.
    """
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get(self, id: Any) -> Optional[ModelType]:
        """Fetch model by primary key."""
        result = await self.db.execute(select(self.model).filter(self.model.id == id))
        return result.scalars().first()

    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Fetch multiple models with pagination support."""
        result = await self.db.execute(select(self.model).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def create(self, obj_in: dict) -> ModelType:
        """Create a new record in the database."""
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        await self.db.flush()
        return db_obj

    async def update(self, db_obj: ModelType, obj_in: dict) -> ModelType:
        """Update an existing database record."""
        for field, value in obj_in.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        self.db.add(db_obj)
        await self.db.flush()
        return db_obj

    async def remove(self, id: Any) -> Optional[ModelType]:
        """Remove a record by ID."""
        obj = await self.get(id)
        if obj:
            await self.db.delete(obj)
            await self.db.flush()
        return obj
