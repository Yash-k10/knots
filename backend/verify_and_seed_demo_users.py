import asyncio
from sqlalchemy import select
from app.core.database import SessionLocal
from app.users.models.role import Role
from app.users.models.user import User
from app.profiles.models.profile import Profile
from app.core.security import hash_password, verify_password
from seed_db import ROLES_DATA, DEMO_USERS


async def seed_and_verify():
    password = "password123"
    print("Connecting to DB and verifying demo users...")

    # Ensure roles exist
    for role_name, perms in ROLES_DATA.items():
        async with SessionLocal() as db:
            try:
                stmt = select(Role).filter(Role.name == role_name)
                res = await db.execute(stmt)
                r = res.scalars().first()
                if not r:
                    new_r = Role(name=role_name, permissions=perms)
                    db.add(new_r)
                    await db.commit()
            except Exception as e:
                print(f"Error checking role {role_name}: {e}")

    # Seed demo users
    for item in DEMO_USERS:
        clean_email = item["email"].strip().lower()
        role_name = item["role"]

        async with SessionLocal() as db:
            try:
                role_stmt = select(Role).filter(Role.name == role_name)
                role_res = await db.execute(role_stmt)
                role_obj = role_res.scalars().first()

                user_stmt = select(User).filter(User.email.ilike(clean_email))
                user_res = await db.execute(user_stmt)
                user = user_res.scalars().first()

                if not user:
                    print(f"[+] Creating {clean_email} ({role_name})")
                    user = User(
                        email=clean_email,
                        hashed_password=hash_password(password),
                        role_id=role_obj.id if role_obj else None,
                        is_active=True,
                        is_verified=True,
                    )
                    db.add(user)
                    await db.flush()

                    profile = Profile(
                        user_id=user.id,
                        first_name=item["first_name"],
                        last_name=item["last_name"],
                        bio=item["bio"],
                        department=item["department"],
                    )
                    db.add(profile)
                    await db.commit()
                else:
                    user.hashed_password = hash_password(password)
                    user.role_id = role_obj.id if role_obj else user.role_id
                    user.is_active = True
                    user.is_verified = True
                    await db.commit()
                    print(f"[OK] Updated {clean_email} ({role_name})")
            except Exception as e:
                print(f"[-] Error with {clean_email}: {e}")

    print("\n--- Final Verification of Demo Users in DB ---")
    async with SessionLocal() as db:
        for item in DEMO_USERS:
            clean_email = item["email"].strip().lower()
            stmt = (
                select(User, Role)
                .outerjoin(Role, User.role_id == Role.id)
                .filter(User.email.ilike(clean_email))
            )
            res = await db.execute(stmt)
            row = res.first()
            if row:
                u, r = row
                pwd_ok = verify_password(password, u.hashed_password)
                role_str = r.name if r else "No Role"
                print(
                    f"Verified: {u.email} | Role: {role_str} | Active: {u.is_active} | Verified: {u.is_verified} | Pwd Check: {'PASS' if pwd_ok else 'FAIL'}"
                )
            else:
                print(f"Missing: {clean_email}")


if __name__ == "__main__":
    asyncio.run(seed_and_verify())
