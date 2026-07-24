import unittest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import Base
from app.main import app
from app.core.database import get_db
from app.auth.dependencies.auth import get_current_user
from app.users.models.user import User
from app.users.models.role import Role
from app.events.models.event_category import EventCategory, EventCategoryType


class TestEventsRouter(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Create an in-memory SQLite database for testing
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )
        self.db = self.SessionLocal()

        # Seed initial roles
        self.student_role = Role(id=1, name="STUDENT")
        self.db.add(self.student_role)
        await self.db.commit()

        # Create mock user
        self.test_user = User(
            id=1,
            email="test_user@knots.edu",
            hashed_password="hashed_password",
            role_id=1,
            is_active=True,
            is_verified=True,
        )
        self.db.add(self.test_user)
        await self.db.commit()

        # Seed category
        self.category = EventCategory(
            id=1,
            name=EventCategoryType.TECHNICAL.value,
            description="Tech events",
        )
        self.db.add(self.category)
        await self.db.commit()

        async def override_get_db():
            async with self.SessionLocal() as session:
                yield session
                await session.commit()

        async def override_get_current_user():
            async with self.SessionLocal() as session:
                stmt = (
                    select(User)
                    .where(User.id == self.test_user.id)
                    .options(selectinload(User.role))
                )
                res = await session.execute(stmt)
                return res.scalar()

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = override_get_current_user

    async def asyncTearDown(self):
        app.dependency_overrides.clear()
        await self.db.close()
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await self.engine.dispose()

    async def test_full_events_router_flow(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            # 1. Create Event
            now = datetime.now(timezone.utc)
            start_dt = (now + timedelta(days=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
            end_dt = (now + timedelta(days=2, hours=3)).strftime("%Y-%m-%dT%H:%M:%SZ")

            event_payload = {
                "title": "FastAPI Workshop",
                "description": "Learn to build APIs",
                "location": "Seminar Hall A",
                "start_datetime": start_dt,
                "end_datetime": end_dt,
                "max_capacity": 100,
                "is_rsvp_enabled": True,
                "category_id": self.category.id,
            }
            res = await ac.post("/api/v1/events", json=event_payload)
            self.assertEqual(res.status_code, 200)
            data = res.json()["data"]
            self.assertEqual(data["title"], "FastAPI Workshop")
            event_id = data["id"]

            # 2. Get categories
            res = await ac.get("/api/v1/events/categories")
            self.assertEqual(res.status_code, 200)
            categories = res.json()["data"]
            self.assertEqual(len(categories), 1)
            self.assertEqual(categories[0]["name"], "TECHNICAL")

            # 3. Get single event detail
            res = await ac.get(f"/api/v1/events/{event_id}")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["data"]["location"], "Seminar Hall A")

            # 4. Get events list (including filtering by dates)
            start_filter = (now + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
            end_filter = (now + timedelta(days=3)).strftime("%Y-%m-%dT%H:%M:%SZ")
            res = await ac.get(
                f"/api/v1/events?start_date={start_filter}&end_date={end_filter}"
            )
            self.assertEqual(res.status_code, 200)
            events = res.json()["data"]
            self.assertEqual(len(events), 1)
            self.assertEqual(events[0]["title"], "FastAPI Workshop")

            # 5. Get upcoming events
            res = await ac.get("/api/v1/events/upcoming")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(len(res.json()["data"]), 1)

            # 6. Update Event
            update_payload = {"location": "Lab 5"}
            res = await ac.put(f"/api/v1/events/{event_id}", json=update_payload)
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["data"]["location"], "Lab 5")

            # 7. RSVP to Event
            rsvp_payload = {"status": "GOING", "note": "Will be there!"}
            res = await ac.post(f"/api/v1/events/{event_id}/rsvp", json=rsvp_payload)
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["data"]["status"], "GOING")

            # 8. List RSVPs
            res = await ac.get(f"/api/v1/events/{event_id}/rsvps")
            self.assertEqual(res.status_code, 200)
            rsvps = res.json()["data"]
            self.assertEqual(len(rsvps), 1)
            self.assertEqual(rsvps[0]["status"], "GOING")

            # 9. Cancel RSVP
            res = await ac.delete(f"/api/v1/events/{event_id}/rsvp")
            self.assertEqual(res.status_code, 200)

            # 10. Delete Event
            res = await ac.delete(f"/api/v1/events/{event_id}")
            self.assertEqual(res.status_code, 200)

            # 11. Verify deletion
            res = await ac.get(f"/api/v1/events/{event_id}")
            self.assertEqual(res.status_code, 404)


if __name__ == "__main__":
    unittest.main()
