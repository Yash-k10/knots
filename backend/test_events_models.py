import unittest
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.clubs.models.club import Club
from app.core.base import Base
from app.events.models.event import Event, EventStatus
from app.events.models.event_category import EventCategory, EventCategoryType
from app.events.models.rsvp import RSVP, RSVPStatus
from app.users.models.role import Role
from app.users.models.user import User


class TestEventsModels(unittest.TestCase):
    def setUp(self):
        # In-memory SQLite DB for testing
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

        # Seed default role & test user
        self.role = Role(id=1, name="STUDENT")
        self.session.add(self.role)
        self.session.commit()

        self.user = User(
            email="teststudent@knots.edu",
            hashed_password="hashed_pwd_123",
            role_id=1,
            is_active=True,
            is_verified=True,
        )
        self.session.add(self.user)
        self.session.commit()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(self.engine)

    def test_create_event_category(self):
        category = EventCategory(
            name=EventCategoryType.TECHNICAL.value,
            description="Tech workshops and hackathons",
        )
        self.session.add(category)
        self.session.commit()

        fetched = self.session.query(EventCategory).filter_by(name="TECHNICAL").first()
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.description, "Tech workshops and hackathons")
        self.assertEqual(
            repr(fetched), f"<EventCategory id={fetched.id} name='TECHNICAL'>"
        )

    def test_create_event_with_organizer_and_category(self):
        category = EventCategory(
            name=EventCategoryType.CULTURAL.value,
            description="Cultural fests and musical events",
        )
        self.session.add(category)
        self.session.commit()

        event = Event(
            title="Annual Music Fest 2026",
            description="Grand music festival with live bands.",
            location="Auditorium A",
            start_datetime=datetime.now(timezone.utc).replace(tzinfo=None),
            max_capacity=500,
            is_rsvp_enabled=True,
            status=EventStatus.PUBLISHED,
            organizer_id=self.user.id,
            category_id=category.id,
        )
        self.session.add(event)
        self.session.commit()

        fetched = self.session.query(Event).filter_by(id=event.id).first()
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.title, "Annual Music Fest 2026")
        self.assertEqual(fetched.organizer.email, "teststudent@knots.edu")
        self.assertEqual(fetched.category.name, "CULTURAL")
        self.assertEqual(fetched.status, EventStatus.PUBLISHED)
        self.assertIn("Annual Music Fest 2026", repr(fetched))

    def test_create_event_associated_with_club(self):
        club = Club(
            name="Robotics Club",
            description="Club for robotics enthusiasts",
            category="TECHNICAL",
            creator_id=self.user.id,
        )
        self.session.add(club)
        self.session.commit()

        event = Event(
            title="Robo Wars 2026",
            description="Robot competition",
            location="Lab 101",
            start_datetime=datetime.now(timezone.utc).replace(tzinfo=None),
            organizer_id=self.user.id,
            club_id=club.id,
        )
        self.session.add(event)
        self.session.commit()

        fetched = self.session.query(Event).filter_by(id=event.id).first()
        self.assertIsNotNone(fetched.club)
        self.assertEqual(fetched.club.name, "Robotics Club")

    def test_create_rsvp_and_unique_constraint(self):
        event = Event(
            title="AI Workshop",
            description="Intro to Deep Learning",
            location="Online",
            start_datetime=datetime.now(timezone.utc).replace(tzinfo=None),
            organizer_id=self.user.id,
        )
        self.session.add(event)
        self.session.commit()

        rsvp = RSVP(
            event_id=event.id,
            user_id=self.user.id,
            status=RSVPStatus.GOING,
            note="Excited to attend!",
        )
        self.session.add(rsvp)
        self.session.commit()

        fetched_rsvp = self.session.query(RSVP).filter_by(id=rsvp.id).first()
        self.assertIsNotNone(fetched_rsvp)
        self.assertEqual(fetched_rsvp.status, RSVPStatus.GOING)
        self.assertEqual(len(event.rsvps), 1)

        # Unique constraint test: duplicate RSVP should raise IntegrityError
        duplicate_rsvp = RSVP(
            event_id=event.id,
            user_id=self.user.id,
            status=RSVPStatus.MAYBE,
        )
        self.session.add(duplicate_rsvp)
        with self.assertRaises(IntegrityError):
            self.session.commit()
        self.session.rollback()

    def test_event_rsvp_cascade_delete(self):
        event = Event(
            title="Coding Contest",
            description="Competitive programming",
            location="Lab 2",
            start_datetime=datetime.now(timezone.utc).replace(tzinfo=None),
            organizer_id=self.user.id,
        )
        self.session.add(event)
        self.session.commit()

        rsvp = RSVP(
            event_id=event.id,
            user_id=self.user.id,
            status=RSVPStatus.GOING,
        )
        self.session.add(rsvp)
        self.session.commit()

        # Delete event and verify cascade deletion of RSVP
        self.session.delete(event)
        self.session.commit()

        rsvps_left = self.session.query(RSVP).all()
        self.assertEqual(len(rsvps_left), 0)


if __name__ == "__main__":
    unittest.main()
