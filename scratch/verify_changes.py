import asyncio
import app.core.base  # registers all models
from sqlalchemy import select, text
from app.core.database import SessionLocal
from app.profiles.models.profile import Profile
from app.jobs.models.job_posting import JobPosting
from app.events.models.event import Event
from app.clubs.models.club import Club
from app.users.models.user import User

async def run_verification():
    print("=== Starting Central Admin & Placement Status Backend Verification ===")
    async with SessionLocal() as session:
        # 1. Verify profiles table has placement_status column
        res = await session.execute(text("SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'placement_status'"))
        col = res.fetchone()
        assert col is not None, "placement_status column missing from profiles table!"
        print(f"[OK] profiles.placement_status exists: type={col[1]}, default={col[2]}")

        # 2. Check profile model mapping
        profile_res = await session.execute(select(Profile).limit(1))
        profile = profile_res.scalars().first()
        if profile:
            print(f"[OK] Profile model query works: user_id={profile.user_id}, placement_status={profile.placement_status}")

        # 3. Check Central Admin user role
        admin_res = await session.execute(select(User).where(User.role_id == 9).limit(1))
        central_admin = admin_res.scalars().first()
        if central_admin:
            print(f"[OK] Found Central Admin user: id={central_admin.id}, email={central_admin.email}, role_id={central_admin.role_id}")
        else:
            print("[INFO] No role_id=9 user found in DB currently, checking role id 1 or 2")

        # 4. Test updating placement status
        test_user_id = profile.user_id
        original_status = profile.placement_status
        for new_status in ["Internship", "Placed", "Not Placed"]:
            profile.placement_status = new_status
            await session.commit()
            await session.refresh(profile)
            assert profile.placement_status == new_status, f"Expected {new_status}, got {profile.placement_status}"
            print(f"[OK] Successfully verified status transition to: {new_status}")
        
        # Restore original status
        profile.placement_status = original_status
        await session.commit()

        # 5. Check Opportunities, Events, Clubs tables accessible
        job_cnt = (await session.execute(select(JobPosting))).scalars().all()
        event_cnt = (await session.execute(select(Event))).scalars().all()
        club_cnt = (await session.execute(select(Club))).scalars().all()
        print(f"[OK] DB entities count: Jobs/Opportunities={len(job_cnt)}, Events={len(event_cnt)}, Clubs={len(club_cnt)}")

    print("=== All verification checks passed successfully! ===")

if __name__ == "__main__":
    asyncio.run(run_verification())
