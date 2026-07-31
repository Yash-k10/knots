import unittest
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.core.base  # noqa: F401
from app.core.database import Base
from app.core.exceptions import NotFoundError
from app.profiles.schemas.profile import (
    EducationCreate,
    EducationUpdate,
    EmploymentHistoryCreate,
    EmploymentHistoryUpdate,
    ProfileUpdate,
)
from app.profiles.services.profile import ProfileService
from app.users.models.user import User


class TestProfileService(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )
        self.db = self.SessionLocal()

        self.user = User(
            email="profiletest@example.com", hashed_password="hashed_password"
        )
        self.db.add(self.user)
        await self.db.flush()
        await self.db.commit()

    async def asyncTearDown(self):
        await self.db.close()
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await self.engine.dispose()

    async def test_get_and_update_profile(self):
        service = ProfileService(self.db)
        profile = await service.get_profile_by_user_id(self.user.id)
        self.assertIsNotNone(profile)
        self.assertEqual(profile.user_id, self.user.id)
        self.assertEqual(profile.connection_count, 0)
        self.assertEqual(profile.endorsements, [])

        # Update profile
        update_data = ProfileUpdate(
            first_name="Alice",
            last_name="Johnson",
            bio="Computer Science Major",
            department="Computer Science",
            graduation_year=2026,
            skills=["Python", "FastAPI"],
        )
        updated = await service.update_profile(self.user.id, update_data)
        self.assertEqual(updated.first_name, "Alice")
        self.assertEqual(updated.last_name, "Johnson")
        self.assertEqual(updated.bio, "Computer Science Major")
        self.assertEqual(updated.department, "Computer Science")
        self.assertEqual(updated.graduation_year, 2026)

    async def test_education_crud(self):
        service = ProfileService(self.db)
        edu_in = EducationCreate(
            institution_name="MIT",
            degree="B.S.",
            field_of_study="Computer Science",
            start_date=date(2022, 9, 1),
            end_date=date(2026, 6, 1),
            gpa=3.9,
            description="Honors Program",
        )
        created_edu = await service.add_education(self.user.id, edu_in)
        self.assertIsNotNone(created_edu.id)
        self.assertEqual(created_edu.institution_name, "MIT")

        # Update education
        edu_update = EducationUpdate(gpa=4.0)
        updated_edu = await service.update_education(
            self.user.id, created_edu.id, edu_update
        )
        self.assertEqual(updated_edu.gpa, 4.0)

        # Delete education
        await service.delete_education(self.user.id, created_edu.id)

        # Verify not found on update after delete
        with self.assertRaises(NotFoundError):
            await service.update_education(self.user.id, created_edu.id, edu_update)

    async def test_employment_history_crud(self):
        service = ProfileService(self.db)
        exp_in = EmploymentHistoryCreate(
            company_name="TechCorp",
            title="Software Engineering Intern",
            location="San Francisco, CA",
            start_date=date(2025, 6, 1),
            end_date=date(2025, 8, 31),
            description="Worked on AI platform",
        )
        created_exp = await service.add_employment_history(self.user.id, exp_in)
        self.assertIsNotNone(created_exp.id)
        self.assertEqual(created_exp.company_name, "TechCorp")
        self.assertEqual(created_exp.title, "Software Engineering Intern")

        # Update employment history
        exp_update = EmploymentHistoryUpdate(title="Senior SWE Intern")
        updated_exp = await service.update_employment_history(
            self.user.id, created_exp.id, exp_update
        )
        self.assertEqual(updated_exp.title, "Senior SWE Intern")

        # Delete employment history
        await service.delete_employment_history(self.user.id, created_exp.id)

        # Verify not found on update after delete
        with self.assertRaises(NotFoundError):
            await service.update_employment_history(
                self.user.id, created_exp.id, exp_update
            )


if __name__ == "__main__":
    unittest.main()
