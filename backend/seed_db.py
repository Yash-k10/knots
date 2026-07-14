import asyncio
from sqlalchemy import select
from app.core.database import SessionLocal
from app.users.models.role import Role

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
    print("Database seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_roles())
