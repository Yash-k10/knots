from sqlalchemy.ext.asyncio import AsyncSession
from app.events.repository.event import EventRepository
from app.events.schemas.event import EventCreate
from app.events.models.event import Event


class EventService:
    def __init__(self, db: AsyncSession):
        self.repository = EventRepository(db)

    async def create_event(self, organizer_id: int, event_in: EventCreate) -> Event:
        data = event_in.dict()
        data["organizer_id"] = organizer_id
        return await self.repository.create(data)

    async def list_events(self, skip: int = 0, limit: int = 100) -> list[Event]:
        return await self.repository.get_multi(skip=skip, limit=limit)
