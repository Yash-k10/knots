import unittest
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.core.base  # noqa: F401
from app.connections.services.connection import ConnectionService
from app.core.database import Base
from app.events.models.rsvp import RSVPStatus
from app.events.schemas.event import EventCreate, RSVPCreate
from app.events.services.event import EventService
from app.notifications.services.notification import NotificationService
from app.posts.schemas.post import CommentCreate, PostCreate
from app.posts.services.post import PostService
from app.profiles.models.profile import Profile
from app.users.models.role import Role
from app.users.models.user import User


class TestNotificationsIntegration(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Create an in-memory SQLite database for testing integration
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )
        self.db = self.SessionLocal()

        # Seed roles & users
        self.student_role = Role(id=1, name="STUDENT")
        self.db.add(self.student_role)
        await self.db.commit()

        # Create two test users (User 1 and User 2)
        self.user1 = User(
            id=1,
            email="user1@knots.edu",
            hashed_password="pwd",
            role_id=1,
            is_active=True,
            is_verified=True,
        )
        self.user2 = User(
            id=2,
            email="user2@knots.edu",
            hashed_password="pwd",
            role_id=1,
            is_active=True,
            is_verified=True,
        )
        self.db.add_all([self.user1, self.user2])
        await self.db.commit()

        # Create profiles for user1 and user2
        self.profile1 = Profile(
            user_id=1,
            first_name="Alice",
            last_name="Smith",
        )
        self.profile2 = Profile(
            user_id=2,
            first_name="Bob",
            last_name="Jones",
        )
        self.db.add_all([self.profile1, self.profile2])
        await self.db.commit()

    async def asyncTearDown(self):
        await self.db.close()
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await self.engine.dispose()

    async def test_like_notification(self):
        post_service = PostService(self.db)
        notif_service = NotificationService(self.db)

        # 1. User 1 creates a post
        post_payload = PostCreate(content="Hello world!")
        post = await post_service.create_post(self.user1.id, post_payload)
        await self.db.commit()

        # 2. User 2 likes User 1's post -> should generate notification for User 1
        await post_service.like_post(post.id, self.user2.id)
        await self.db.commit()

        # Verify User 1 got a notification
        notifs = await notif_service.get_user_notifications(self.user1.id)
        self.assertEqual(len(notifs), 1)
        self.assertEqual(notifs[0].title, "New Like")
        self.assertEqual(notifs[0].type, "like")
        self.assertIn("Bob Jones", notifs[0].content)

        # 3. User 1 likes their own post -> should NOT generate notification
        await post_service.like_post(post.id, self.user1.id)
        await self.db.commit()

        # User 1 should still have only 1 notification
        notifs = await notif_service.get_user_notifications(self.user1.id)
        self.assertEqual(len(notifs), 1)

    async def test_comment_notification(self):
        post_service = PostService(self.db)
        notif_service = NotificationService(self.db)

        # 1. User 1 creates a post
        post_payload = PostCreate(content="Check this out!")
        post = await post_service.create_post(self.user1.id, post_payload)
        await self.db.commit()

        # 2. User 2 comments on User 1's post -> should generate notification for User 1
        comment_payload = CommentCreate(content="This is amazing, good job!")
        await post_service.add_comment(post.id, self.user2.id, comment_payload)
        await self.db.commit()

        # Verify User 1 got a comment notification
        notifs = await notif_service.get_user_notifications(self.user1.id)
        self.assertEqual(len(notifs), 1)
        self.assertEqual(notifs[0].title, "New Comment")
        self.assertEqual(notifs[0].type, "comment")
        self.assertIn("Bob Jones", notifs[0].content)
        self.assertIn("This is amazing", notifs[0].content)

        # 3. User 1 comments on their own post -> should NOT generate notification
        await post_service.add_comment(post.id, self.user1.id, comment_payload)
        await self.db.commit()

        # User 1 should still have only 1 notification
        notifs = await notif_service.get_user_notifications(self.user1.id)
        self.assertEqual(len(notifs), 1)

    async def test_connection_request_notification(self):
        connection_service = ConnectionService(self.db)
        notif_service = NotificationService(self.db)

        # User 2 requests connection with User 1 -> should generate notification for User 1
        await connection_service.request_connection(self.user2.id, self.user1.id)
        await self.db.commit()

        # Verify User 1 got a connection request notification
        notifs = await notif_service.get_user_notifications(self.user1.id)
        self.assertEqual(len(notifs), 1)
        self.assertEqual(notifs[0].title, "New Connection Request")
        self.assertEqual(notifs[0].type, "connection_request")
        self.assertIn("Bob Jones", notifs[0].content)

    async def test_event_rsvp_notification(self):
        event_service = EventService(self.db)
        notif_service = NotificationService(self.db)

        # 1. User 1 creates an event
        event_payload = EventCreate(
            title="Tech Talk",
            description="Talking about AI",
            location="Room 101",
            start_datetime=datetime.now(timezone.utc) + timedelta(days=1),
            is_rsvp_enabled=True,
        )
        event = await event_service.create_event(self.user1.id, event_payload)
        await self.db.commit()

        # 2. User 2 RSVPs to the event -> should generate notification for User 1
        rsvp_payload = RSVPCreate(status=RSVPStatus.GOING)
        await event_service.rsvp_to_event(event.id, self.user2.id, rsvp_payload)
        await self.db.commit()

        # Verify User 1 got an RSVP notification
        notifs = await notif_service.get_user_notifications(self.user1.id)
        self.assertEqual(len(notifs), 1)
        self.assertEqual(notifs[0].title, "New Event RSVP")
        self.assertEqual(notifs[0].type, "event_rsvp")
        self.assertIn("Bob Jones", notifs[0].content)
        self.assertIn("is going to", notifs[0].content)

        # 3. User 1 RSVPs to their own event -> should NOT generate notification
        await event_service.rsvp_to_event(event.id, self.user1.id, rsvp_payload)
        await self.db.commit()

        # User 1 should still have only 1 notification
        notifs = await notif_service.get_user_notifications(self.user1.id)
        self.assertEqual(len(notifs), 1)


if __name__ == "__main__":
    unittest.main()
