import unittest
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.core.database import Base
import app.core.base  # noqa: F401
from app.users.models.user import User
from app.users.models.role import Role
from app.events.models.event_category import EventCategory, EventCategoryType
from app.events.schemas.event import EventCreate
from app.events.services.event import EventService


class TestEventsService(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Create an in-memory SQLite database for testing
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )
        self.db = self.SessionLocal()

        # Seed roles & user
        role = Role(id=1, name="STUDENT")
        self.db.add(role)
        await self.db.commit()

        self.user = User(
            id=1,
            email="organizer@knots.edu",
            hashed_password="hashed_pwd_123",
            role_id=1,
            is_active=True,
            is_verified=True,
        )
        self.db.add(self.user)
        await self.db.commit()

        # Seed category
        self.category = EventCategory(
            id=1,
            name=EventCategoryType.TECHNICAL.value,
            description="Technical events",
        )
        self.db.add(self.category)
        await self.db.commit()

    async def asyncTearDown(self):
        await self.db.close()
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await self.engine.dispose()

    async def test_get_events_filtered_by_date(self):
        service = EventService(self.db)
        now = datetime.now(timezone.utc)

        # Create three events with different start dates
        # Event 1: starts in 1 day
        # Event 2: starts in 5 days
        # Event 3: starts in 10 days
        event1_payload = EventCreate(
            title="Event 1 (1 Day)",
            description="Starts tomorrow",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2),
            location="Lab A",
            category_id=self.category.id,
            max_capacity=50,
            is_rsvp_enabled=True,
        )
        event2_payload = EventCreate(
            title="Event 2 (5 Days)",
            description="Starts in 5 days",
            start_datetime=now + timedelta(days=5),
            end_datetime=now + timedelta(days=5, hours=2),
            location="Lab B",
            category_id=self.category.id,
            max_capacity=50,
            is_rsvp_enabled=True,
        )
        event3_payload = EventCreate(
            title="Event 3 (10 Days)",
            description="Starts in 10 days",
            start_datetime=now + timedelta(days=10),
            end_datetime=now + timedelta(days=10, hours=2),
            location="Lab C",
            category_id=self.category.id,
            max_capacity=50,
            is_rsvp_enabled=True,
        )

        await service.create_event(self.user.id, event1_payload)
        await service.create_event(self.user.id, event2_payload)
        await service.create_event(self.user.id, event3_payload)

        # Verify all three are created
        all_events = await service.get_events()
        self.assertEqual(len(all_events), 3)

        # 1. Filter by start_date (starts on or after now + 3 days)
        # Expected: Event 2 and Event 3
        start_filter = now + timedelta(days=3)
        res_start = await service.get_events(start_date=start_filter)
        self.assertEqual(len(res_start), 2)
        titles_start = [e.title for e in res_start]
        self.assertIn("Event 2 (5 Days)", titles_start)
        self.assertIn("Event 3 (10 Days)", titles_start)

        # 2. Filter by end_date (starts on or before now + 7 days)
        # Expected: Event 1 and Event 2
        end_filter = now + timedelta(days=7)
        res_end = await service.get_events(end_date=end_filter)
        self.assertEqual(len(res_end), 2)
        titles_end = [e.title for e in res_end]
        self.assertIn("Event 1 (1 Day)", titles_end)
        self.assertIn("Event 2 (5 Days)", titles_end)

        # 3. Filter by both start_date and end_date (between now + 3 days and now + 7 days)
        # Expected: Event 2 only
        res_both = await service.get_events(
            start_date=start_filter, end_date=end_filter
        )
        self.assertEqual(len(res_both), 1)
        self.assertEqual(res_both[0].title, "Event 2 (5 Days)")

        # 4. Count filtered check
        # We can also check count on the repo directly
        count_both = await service.event_repo.count_filtered(
            start_date=start_filter.replace(tzinfo=None),
            end_date=end_filter.replace(tzinfo=None),
        )
        self.assertEqual(count_both, 1)


if __name__ == "__main__":
    unittest.main()
