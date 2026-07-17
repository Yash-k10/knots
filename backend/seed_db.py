import asyncio
from sqlalchemy import select
from app.core.database import SessionLocal
from app.users.models.role import Role
from app.events.models.event_category import EventCategory
import app.core.base  # noqa: F401

# Pre-defined roles and their permissions
ROLES_DATA = {
    "Admin": [
        "admin_access",
        "read_posts",
        "create_posts",
        "delete_posts",
        "moderate_content",
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


async def main():
    await seed_roles()
    await seed_categories()
    print("All database seeding tasks completed successfully.")


if __name__ == "__main__":
    asyncio.run(main())
