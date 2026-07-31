import unittest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.users.models.role import Role
from app.users.models.user import User
from app.profiles.models.profile import Profile
from app.jobs.models.company import Company


class TestFullPlatformIntegration(unittest.IsolatedAsyncioTestCase):
    """Full End-to-End Integration Suite testing all API endpoints together across modules."""

    async def asyncSetUp(self):
        # Create isolated SQLite in-memory database engine for integration test run
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )

        async with self.SessionLocal() as db:
            # Seed standard roles
            self.admin_role = Role(id=1, name="Admin")
            self.student_role = Role(id=2, name="Student")
            db.add_all([self.admin_role, self.student_role])
            await db.commit()

            # Seed Company for jobs
            self.company = Company(id=1, name="Tech Corp", industry="Software")
            db.add(self.company)
            await db.commit()

            # Seed Test User 1 (Student)
            self.user1 = User(
                id=1,
                email="student1@sbjit.edu.in",
                hashed_password=hash_password("password123"),
                role_id=2,
                is_active=True,
            )
            self.user1.role = self.student_role
            self.profile1 = Profile(
                id=1,
                user_id=1,
                first_name="Alex",
                last_name="Rivers",
                bio="Computer Science enthusiast",
                department="Computer Science",
                skills=["Python", "React", "FastAPI"],
                graduation_year=2026,
            )

            # Seed Test User 2 (Student)
            self.user2 = User(
                id=2,
                email="student2@sbjit.edu.in",
                hashed_password=hash_password("password123"),
                role_id=2,
                is_active=True,
            )
            self.user2.role = self.student_role
            self.profile2 = Profile(
                id=2,
                user_id=2,
                first_name="Jordan",
                last_name="Lee",
                bio="Data Science student",
                department="Data Science",
                skills=["Python", "SQL", "Machine Learning"],
                graduation_year=2026,
            )

            # Seed Test User 3 (Admin)
            self.admin = User(
                id=3,
                email="admin@sbjit.edu.in",
                hashed_password=hash_password("adminpass123"),
                role_id=1,
                is_active=True,
            )
            self.admin.role = self.admin_role

            db.add_all(
                [self.user1, self.user2, self.admin, self.profile1, self.profile2]
            )
            await db.commit()

        # Database dependency override
        async def override_get_db():
            async with self.SessionLocal() as session:
                yield session
                await session.commit()

        app.dependency_overrides[get_db] = override_get_db

        # Auth headers for user 1 & admin
        self.token_user1 = create_access_token(subject=str(self.user1.id))
        self.token_user2 = create_access_token(subject=str(self.user2.id))
        self.token_admin = create_access_token(subject=str(self.admin.id))

        self.headers_user1 = {"Authorization": f"Bearer {self.token_user1}"}
        self.headers_user2 = {"Authorization": f"Bearer {self.token_user2}"}
        self.headers_admin = {"Authorization": f"Bearer {self.token_admin}"}

    async def asyncTearDown(self):
        app.dependency_overrides.clear()
        await self.engine.dispose()

    async def test_full_platform_api_workflow_integration(self):
        """End-to-end multi-module API integration test verifying all core routes together."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:

            # -------------------------------------------------------------
            # 1. AUTH & USER ENDPOINTS
            # -------------------------------------------------------------
            # Register new user
            reg_resp = await client.post(
                "/api/v1/auth/register",
                json={
                    "email": "newuser@sbjit.edu.in",
                    "password": "Password123!",
                    "role_id": 2,
                },
            )
            self.assertIn(reg_resp.status_code, [200, 201])

            # Get current user profile
            me_resp = await client.get("/api/v1/users/me", headers=self.headers_user1)
            self.assertEqual(me_resp.status_code, 200)
            self.assertEqual(me_resp.json()["data"]["email"], "student1@sbjit.edu.in")

            # -------------------------------------------------------------
            # 2. PROFILE ENDPOINTS
            # -------------------------------------------------------------
            # Get own profile
            prof_resp = await client.get(
                "/api/v1/profiles/me", headers=self.headers_user1
            )
            self.assertEqual(prof_resp.status_code, 200)

            # Update own profile
            update_prof = await client.put(
                "/api/v1/profiles/me",
                headers=self.headers_user1,
                json={
                    "first_name": "Alex",
                    "last_name": "Rivers",
                    "bio": "Updated bio for CS enthusiast",
                    "skills": ["Python", "React", "FastAPI", "Docker"],
                    "department": "Computer Science",
                    "graduation_year": 2026,
                },
            )
            self.assertEqual(update_prof.status_code, 200)

            # -------------------------------------------------------------
            # 3. POSTS & FEED ENDPOINTS
            # -------------------------------------------------------------
            # Create post by User 1
            create_post = await client.post(
                "/api/v1/posts",
                headers=self.headers_user1,
                json={"content": "Excited to launch our platform integration tests!"},
            )
            self.assertIn(create_post.status_code, [200, 201])
            post_id = create_post.json()["data"]["id"]

            # Get feed
            feed_resp = await client.get(
                "/api/v1/posts/feed", headers=self.headers_user1
            )
            self.assertEqual(feed_resp.status_code, 200)

            # Like post by User 2
            like_resp = await client.post(
                f"/api/v1/posts/{post_id}/like", headers=self.headers_user2
            )
            self.assertEqual(like_resp.status_code, 200)

            # Comment on post by User 2
            comment_resp = await client.post(
                f"/api/v1/posts/{post_id}/comments",
                headers=self.headers_user2,
                json={"content": "Great milestone for the team!"},
            )
            self.assertIn(comment_resp.status_code, [200, 201])

            # -------------------------------------------------------------
            # 4. CONNECTIONS ENDPOINTS
            # -------------------------------------------------------------
            # Send connection request from User 1 to User 2
            conn_req = await client.post(
                "/api/v1/connections",
                headers=self.headers_user1,
                json={"addressee_id": 2},
            )
            self.assertIn(conn_req.status_code, [200, 201])
            connection_id = conn_req.json()["data"]["id"]

            # Accept connection request by User 2
            accept_req = await client.patch(
                f"/api/v1/connections/{connection_id}/accept",
                headers=self.headers_user2,
            )
            self.assertEqual(accept_req.status_code, 200)

            # Get user connections
            my_conns = await client.get(
                "/api/v1/connections/me", headers=self.headers_user1
            )
            self.assertEqual(my_conns.status_code, 200)

            # -------------------------------------------------------------
            # 5. JOBS ENDPOINTS
            # -------------------------------------------------------------
            # Create a job posting by Admin
            job_create = await client.post(
                "/api/v1/jobs",
                headers=self.headers_admin,
                json={
                    "company_id": 1,
                    "title": "Software Engineering Intern",
                    "description": "Building next-gen platforms with FastAPI and React.",
                    "job_type": "internship",
                    "workplace_type": "remote",
                    "location": "Remote",
                    "required_skills": ["Python", "React"],
                },
            )
            self.assertIn(job_create.status_code, [200, 201])
            job_id = job_create.json()["data"]["id"]

            # List jobs
            jobs_list = await client.get("/api/v1/jobs", headers=self.headers_user1)
            self.assertEqual(jobs_list.status_code, 200)

            # Apply for job by User 1
            apply_job = await client.post(
                f"/api/v1/jobs/{job_id}/apply",
                headers=self.headers_user1,
                json={
                    "job_posting_id": job_id,
                    "cover_letter": "I love building fullstack applications.",
                },
            )
            self.assertIn(apply_job.status_code, [200, 201])

            # -------------------------------------------------------------
            # 6. EVENTS & CLUBS ENDPOINTS
            # -------------------------------------------------------------
            # Create an Event by Admin
            event_create = await client.post(
                "/api/v1/events",
                headers=self.headers_admin,
                json={
                    "title": "Annual Hackathon 2026",
                    "description": "Join the biggest student coding event.",
                    "start_datetime": "2026-09-01T10:00:00Z",
                    "location": "Main Auditorium",
                },
            )
            self.assertIn(event_create.status_code, [200, 201])
            event_id = event_create.json()["data"]["id"]

            # RSVP for event by User 1
            rsvp_resp = await client.post(
                f"/api/v1/events/{event_id}/rsvp",
                headers=self.headers_user1,
                json={"status": "GOING"},
            )
            self.assertEqual(rsvp_resp.status_code, 200)

            # Create Club by Admin
            club_create = await client.post(
                "/api/v1/clubs",
                headers=self.headers_admin,
                json={
                    "name": "AI & Robotics Club",
                    "description": "Exploring artificial intelligence and autonomous systems.",
                    "category": "Technology",
                },
            )
            self.assertIn(club_create.status_code, [200, 201])
            club_id = club_create.json()["data"]["id"]

            # Join club by User 1
            join_club = await client.post(
                f"/api/v1/clubs/{club_id}/join",
                headers=self.headers_user1,
            )
            self.assertEqual(join_club.status_code, 200)

            # -------------------------------------------------------------
            # 7. MESSAGING ENDPOINTS
            # -------------------------------------------------------------
            # Send direct message from User 1 to User 2
            msg_resp = await client.post(
                "/api/v1/messages/direct",
                headers=self.headers_user1,
                json={"receiver_id": 2, "content": "Hello Jordan, nice connecting!"},
            )
            self.assertIn(msg_resp.status_code, [200, 201])

            # Get conversations for User 1
            conv_list = await client.get(
                "/api/v1/conversations",
                headers=self.headers_user1,
            )
            self.assertEqual(conv_list.status_code, 200)

            # Get unread message count
            unread_resp = await client.get(
                "/api/v1/messages/unread/count",
                headers=self.headers_user2,
            )
            self.assertEqual(unread_resp.status_code, 200)

            # -------------------------------------------------------------
            # 8. NOTIFICATIONS ENDPOINTS
            # -------------------------------------------------------------
            # List notifications for User 1
            notif_resp = await client.get(
                "/api/v1/notifications", headers=self.headers_user1
            )
            self.assertEqual(notif_resp.status_code, 200)

            # Get unread notification count
            unread_notif = await client.get(
                "/api/v1/notifications/unread-count", headers=self.headers_user1
            )
            self.assertEqual(unread_notif.status_code, 200)

            # Mark all notifications as read
            read_all_notif = await client.patch(
                "/api/v1/notifications/read-all", headers=self.headers_user1
            )
            self.assertEqual(read_all_notif.status_code, 200)

            # -------------------------------------------------------------
            # 9. AI RECOMMENDATIONS & TOOLS ENDPOINTS
            # -------------------------------------------------------------
            # Connection suggestions
            ai_conn = await client.get(
                "/api/v1/ai/connection-suggestions?limit=5", headers=self.headers_user1
            )
            self.assertEqual(ai_conn.status_code, 200)
            self.assertIsInstance(ai_conn.json()["data"], list)

            # Job recommendations
            ai_job = await client.get(
                "/api/v1/ai/job-recommendations?limit=5", headers=self.headers_user1
            )
            self.assertEqual(ai_job.status_code, 200)
            self.assertIsInstance(ai_job.json()["data"], list)

            # Content recommendations
            ai_content = await client.get(
                "/api/v1/ai/content-recommendations?limit=5", headers=self.headers_user1
            )
            self.assertEqual(ai_content.status_code, 200)
            self.assertIsInstance(ai_content.json()["data"], list)

            # Analyze resume
            res_analysis = await client.post(
                "/api/v1/ai/analyze-resume",
                headers=self.headers_user1,
                json={"resume_text": "Experienced Python engineer with React skills."},
            )
            self.assertEqual(res_analysis.status_code, 200)

            # Generate career roadmap
            roadmap_gen = await client.post(
                "/api/v1/ai/roadmap",
                headers=self.headers_user1,
                json={
                    "target_role": "Senior Fullstack Developer",
                    "current_skills": ["Python", "React"],
                },
            )
            self.assertEqual(roadmap_gen.status_code, 200)

            # -------------------------------------------------------------
            # 10. ANALYTICS & GLOBAL SEARCH ENDPOINTS
            # -------------------------------------------------------------
            # Global search
            search_resp = await client.get(
                "/api/v1/search?q=Python", headers=self.headers_user1
            )
            self.assertEqual(search_resp.status_code, 200)

            # System stats (Analytics)
            stats_resp = await client.get(
                "/api/v1/analytics/stats", headers=self.headers_user1
            )
            self.assertEqual(stats_resp.status_code, 200)

            # Trending posts (Analytics)
            trending_resp = await client.get(
                "/api/v1/analytics/trending-posts?limit=5", headers=self.headers_user1
            )
            self.assertEqual(trending_resp.status_code, 200)

            # -------------------------------------------------------------
            # 11. ADMIN ENDPOINTS
            # -------------------------------------------------------------
            # Admin stats
            admin_stats = await client.get(
                "/api/v1/admin/stats", headers=self.headers_admin
            )
            self.assertEqual(admin_stats.status_code, 200)

            # Admin user list
            admin_users = await client.get(
                "/api/v1/admin/users", headers=self.headers_admin
            )
            self.assertEqual(admin_users.status_code, 200)


if __name__ == "__main__":
    unittest.main()
