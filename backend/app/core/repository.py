from typing import Any, Generic, List, Optional, Type, TypeVar
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """
    Generic Base Repository pattern for database entities.
    Provides standard CRUD operations and utility queries that all
    module-specific repositories inherit.
    """

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get(self, id: Any) -> Optional[ModelType]:
        """Fetch model by primary key."""
        result = await self.db.execute(select(self.model).filter(self.model.id == id))
        return result.scalars().first()

    async def get_by_field(
        self, field_name: str, value: Any
    ) -> Optional[ModelType]:
        """Fetch a single record by any column name.

        Example: ``await repo.get_by_field("email", "user@example.com")``
        """
        column = getattr(self.model, field_name, None)
        if column is None:
            raise ValueError(
                f"Model {self.model.__name__} has no field '{field_name}'"
            )
        result = await self.db.execute(select(self.model).filter(column == value))
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

    async def exists(self, id: Any) -> bool:
        """Check whether a record with the given ID exists."""
        result = await self.db.execute(
            select(self.model.id).filter(self.model.id == id)
        )
        return result.scalars().first() is not None

    async def count(self) -> int:
        """Return the total number of records for this model."""
        result = await self.db.execute(select(func.count()).select_from(self.model))
        return result.scalar_one()

