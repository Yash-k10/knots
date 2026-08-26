import asyncio

from sqlalchemy import select

import app.core.base  # noqa: F401
from app.core.database import SessionLocal
from app.events.models.event_category import EventCategory
from app.users.models.role import Role

# Pre-defined roles and their permissions
ROLES_DATA = {
    "Super Admin": [
        "*",
        "superadmin_access",
        "admin_access",
        "read_posts",
        "create_posts",
        "delete_posts",
        "delete_any_post",
        "delete_any_comment",
        "moderate_content",
        "manage_users",
        "manage_roles",
        "post_jobs",
        "create_events",
        "manage_clubs",
    ],
    "Admin": [
        "admin_access",
        "read_posts",
        "create_posts",
        "delete_posts",
        "delete_any_post",
        "delete_any_comment",
        "moderate_content",
        "manage_users",
        "post_jobs",
        "create_events",
        "manage_clubs",
    ],
    "Student": [
        "read_posts",
        "create_posts",
        "comment_posts",
        "like_posts",
        "connect_users",
    ],
    "Alumni": [
        "read_posts",
        "create_posts",
        "comment_posts",
        "like_posts",
        "connect_users",
        "post_jobs",
    ],
    "Recruiter": ["read_posts", "post_jobs"],
    "Faculty": [
        "read_posts",
        "create_posts",
        "comment_posts",
        "like_posts",
        "connect_users",
        "create_events",
        "post_jobs",
    ],
}

# Pre-defined event categories
CATEGORIES_DATA = {
    "ACADEMIC": "Seminars, lectures, and academic discussions",
    "CULTURAL": "Arts, music, drama, and cultural festivals",
    "SPORTS": "Inter and intra-college sports matches and tournaments",
    "TECHNICAL": "Hackathons, coding contests, and technical presentations",
    "WORKSHOP": "Hands-on practical learning sessions and bootcamps",
    "SEMINAR": "Informational presentations and research talks",
    "SOCIAL": "Networking events, club gather-ups, and meetups",
    "CAREER": "Job fairs, recruitment drives, and resume review sessions",
    "OTHER": "Miscellaneous events",
}


async def seed_roles():
    print("Seeding database roles...")
    async with SessionLocal() as db:
        for role_name, permissions in ROLES_DATA.items():
            # Check if role exists
            stmt = select(Role).filter(Role.name == role_name)
            result = await db.execute(stmt)
            existing_role = result.scalars().first()

            if not existing_role:
                print(f"Creating role: {role_name}...")
                new_role = Role(name=role_name, permissions=permissions)
                db.add(new_role)
            else:
                print(f"Role {role_name} already exists. Updating permissions...")
                existing_role.permissions = permissions

        await db.commit()
    print("Database seeding roles completed.")


async def seed_categories():
    print("Seeding database event categories...")
    async with SessionLocal() as db:
        for name, desc in CATEGORIES_DATA.items():
            stmt = select(EventCategory).filter(EventCategory.name == name)
            result = await db.execute(stmt)
            existing = result.scalars().first()

            if not existing:
                print(f"Creating category: {name}...")
                new_cat = EventCategory(name=name, description=desc)
                db.add(new_cat)
            else:
                print(f"Category {name} already exists. Updating description...")
                existing.description = desc

        await db.commit()
    print("Database seeding categories completed.")


from app.users.models.user import User
from app.profiles.models.profile import Profile
from app.core.security import hash_password
import sys


async def promote_user_to_superadmin(email: str, password: str = "password123"):
    clean_email = email.strip().lower()
    print(f"Assigning Super Admin role to {clean_email}...")
    async with SessionLocal() as db:
        role_stmt = select(Role).filter(Role.name == "Super Admin")
        role_res = await db.execute(role_stmt)
        superadmin_role = role_res.scalars().first()
        if not superadmin_role:
            print("Super Admin role not found in DB. Creating it...")
            superadmin_role = Role(
                name="Super Admin", permissions=ROLES_DATA["Super Admin"]
            )
            db.add(superadmin_role)
            await db.flush()

        user_stmt = select(User).filter(User.email.ilike(clean_email))
        user_res = await db.execute(user_stmt)
        user = user_res.scalars().first()

        if not user:
            print(
                f"User '{clean_email}' does not exist yet. Creating a new Super Admin account..."
            )
            user = User(
                email=clean_email,
                hashed_password=hash_password(password),
                role_id=superadmin_role.id,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            await db.flush()

            # Create default profile
            user_prefix = clean_email.split("@")[0].replace(".", " ").title()
            profile = Profile(
                user_id=user.id,
                first_name=user_prefix,
                last_name="(Super Admin)",
                bio="Platform Super Administrator with master controls.",
                department="Administration",
            )
            db.add(profile)
            await db.commit()
            print(
                f"Successfully created Super Admin user '{clean_email}' (ID: {user.id}) with password: '{password}'!"
            )
        else:
            user.role_id = superadmin_role.id
            user.is_active = True
            user.is_verified = True
            await db.commit()
            print(
                f"Successfully promoted existing user '{user.email}' (ID: {user.id}) to Super Admin!"
            )


async def main():
    if len(sys.argv) > 2 and sys.argv[1] in (
        "--make-superadmin",
        "--superadmin",
        "--create-superadmin",
    ):
        target_email = sys.argv[2]
        custom_password = sys.argv[3] if len(sys.argv) > 3 else "password123"
        await seed_roles()
        await promote_user_to_superadmin(target_email, custom_password)
    else:
        await seed_roles()
        await seed_categories()
        print("All database seeding tasks completed successfully.")


if __name__ == "__main__":
    asyncio.run(main())
