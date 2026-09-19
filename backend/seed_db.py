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
    "Central Admin": [
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
    ],
    "Faculty": [
        "read_posts",
        "create_posts",
        "comment_posts",
        "like_posts",
        "connect_users",
    ],
    "HOD": [
        "read_posts",
        "create_posts",
        "comment_posts",
        "like_posts",
        "connect_users",
        "manage_department",
    ],
    "Controller": [
        "read_posts",
        "create_posts",
        "comment_posts",
        "like_posts",
        "delete_posts",
        "create_events",
        "manage_applications",
    ],
    "TPO": [
        "read_posts",
        "create_posts",
        "comment_posts",
        "like_posts",
        "post_jobs",
        "manage_applications",
        "manage_placements",
    ],
    "Dean": [
        "read_posts",
        "create_posts",
        "comment_posts",
        "like_posts",
        "connect_users",
    ],
    "Principal": [
        "read_posts",
        "create_posts",
        "comment_posts",
        "like_posts",
        "connect_users",
    ],
    "CEO": [
        "read_posts",
        "create_posts",
        "comment_posts",
        "like_posts",
        "connect_users",
    ],
    "Management": [
        "admin_access",
        "read_posts",
        "create_posts",
        "comment_posts",
        "like_posts",
        "delete_posts",
        "moderate_content",
        "manage_users",
        "post_jobs",
        "create_events",
        "manage_clubs",
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


DEMO_USERS = [
    {
        "email": "student.demo@sbjit.edu.in",
        "role": "Student",
        "first_name": "Aarav",
        "last_name": "Sharma",
        "bio": "Third-year Computer Science student passionate about full-stack engineering and cloud systems.",
        "department": "Computer Science",
    },
    {
        "email": "student@sbjit.edu.in",
        "role": "Student",
        "first_name": "Aarav",
        "last_name": "Sharma",
        "bio": "Third-year Computer Science student passionate about full-stack engineering and cloud systems.",
        "department": "Computer Science",
    },
    {
        "email": "faculty.demo@sbjit.edu.in",
        "role": "Faculty",
        "first_name": "Dr. Rajesh",
        "last_name": "Verma",
        "bio": "Associate Professor in CSE specializing in Distributed Systems and Network Security.",
        "department": "Computer Science",
    },
    {
        "email": "faculty@sbjit.edu.in",
        "role": "Faculty",
        "first_name": "Dr. Rajesh",
        "last_name": "Verma",
        "bio": "Associate Professor in CSE specializing in Distributed Systems and Network Security.",
        "department": "Computer Science",
    },
    {
        "email": "hod.demo@sbjit.edu.in",
        "role": "HOD",
        "first_name": "Dr. Arvind",
        "last_name": "Sharma",
        "bio": "Professor & Head of Department, Computer Science & Engineering.",
        "department": "Computer Science",
    },
    {
        "email": "hod@sbjit.edu.in",
        "role": "HOD",
        "first_name": "Dr. Arvind",
        "last_name": "Sharma",
        "bio": "Professor & Head of Department, Computer Science & Engineering.",
        "department": "Computer Science",
    },
    {
        "email": "alumni.demo@sbjit.edu.in",
        "role": "Alumni",
        "first_name": "Priya",
        "last_name": "Verma",
        "bio": "Batch of 2023 Alumna, currently Software Engineer II at Microsoft Azure Core.",
        "department": "Computer Science",
    },
    {
        "email": "alumni@sbjit.edu.in",
        "role": "Alumni",
        "first_name": "Priya",
        "last_name": "Verma",
        "bio": "Batch of 2023 Alumna, currently Software Engineer II at Microsoft Azure Core.",
        "department": "Computer Science",
    },
    {
        "email": "controller.fy@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Snehal",
        "last_name": "Deshmukh",
        "bio": "Department Controller overseeing First Year engineering curriculum, orientation, and student activities.",
        "department": "First Year",
        "password": "Password@123",
    },
    {
        "email": "controller.cse@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Sanjay",
        "last_name": "Deshmukh",
        "bio": "Department Controller overseeing Computer Science & Engineering department approvals, clubs, and academic pipelines.",
        "department": "CSE",
        "password": "Password@123",
    },
    {
        "email": "controller.aiml@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Amit",
        "last_name": "Sharma",
        "bio": "Department Controller overseeing AI & Machine Learning department events, student clubs, and industry collaborations.",
        "department": "CSE(AIML)",
        "password": "Password@123",
    },
    {
        "email": "controller.aids@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Neha",
        "last_name": "Gupta",
        "bio": "Department Controller overseeing AI & Data Science activities, hackathons, and departmental permissions.",
        "department": "CSE(AIDS)",
        "password": "Password@123",
    },
    {
        "email": "controller.it@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Rajesh",
        "last_name": "Patel",
        "bio": "Department Controller overseeing Information Technology departmental programs and student development.",
        "department": "IT",
        "password": "Password@123",
    },
    {
        "email": "controller.etc@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Meera",
        "last_name": "Kulkarni",
        "bio": "Department Controller overseeing Electronics & Telecommunication Engineering departmental initiatives.",
        "department": "ETC",
        "password": "Password@123",
    },
    {
        "email": "controller.ee@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Vivek",
        "last_name": "Joshi",
        "bio": "Department Controller overseeing Electrical Engineering student clubs, labs, and event management.",
        "department": "EE",
        "password": "Password@123",
    },
    {
        "email": "controller.me@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Rahul",
        "last_name": "Verma",
        "bio": "Department Controller overseeing Mechanical Engineering student forums, projects, and departmental oversight.",
        "department": "ME",
        "password": "Password@123",
    },
    {
        "email": "controller.bca@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Pooja",
        "last_name": "Nair",
        "bio": "Department Controller overseeing Bachelor of Computer Applications events, seminars, and student approvals.",
        "department": "BCA",
        "password": "Password@123",
    },
    {
        "email": "controller.mca@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Anand",
        "last_name": "Rao",
        "bio": "Department Controller overseeing Master of Computer Applications workshops, hackathons, and activities.",
        "department": "MCA",
        "password": "Password@123",
    },
    {
        "email": "controller.mba@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Sunita",
        "last_name": "Patil",
        "bio": "Department Controller overseeing Master of Business Administration programs, conclaves, and corporate sessions.",
        "department": "MBA",
        "password": "Password@123",
    },
    {
        "email": "centraladmin.demo@sbjit.edu.in",
        "role": "Central Admin",
        "first_name": "Vikas",
        "last_name": "Mehta",
        "bio": "Central Platform Administrator managing institutional users, roles, and security governance.",
        "department": "Administration",
    },
    {
        "email": "admin@sbjit.edu.in",
        "role": "Central Admin",
        "first_name": "Vikas",
        "last_name": "Mehta",
        "bio": "Central Platform Administrator managing institutional users, roles, and security governance.",
        "department": "Administration",
    },
    {
        "email": "superadmin.demo@sbjit.edu.in",
        "role": "Super Admin",
        "first_name": "Super",
        "last_name": "Admin",
        "bio": "Platform Super Administrator with master controls.",
        "department": "Administration",
    },
    {
        "email": "tpo.demo@sbjit.edu.in",
        "role": "TPO",
        "first_name": "Prof. Aniket",
        "last_name": "Kulkarni",
        "bio": "Head of Training & Placement Office managing corporate recruiter drives and candidate placement pipelines.",
        "department": "Training & Placement Cell",
    },
    {
        "email": "tpo@sbjit.edu.in",
        "role": "TPO",
        "first_name": "Prof. Aniket",
        "last_name": "Kulkarni",
        "bio": "Head of Training & Placement Office managing corporate recruiter drives and candidate placement pipelines.",
        "department": "Training & Placement Cell",
    },
    {
        "email": "dean.demo@sbjit.edu.in",
        "role": "Dean",
        "first_name": "Dr. Meenakshi",
        "last_name": "Rao",
        "bio": "Dean of Academic Affairs overseeing curriculum, research grants, and departmental excellence.",
        "department": "Academic Affairs",
    },
    {
        "email": "dean@sbjit.edu.in",
        "role": "Dean",
        "first_name": "Dr. Meenakshi",
        "last_name": "Rao",
        "bio": "Dean of Academic Affairs overseeing curriculum, research grants, and departmental excellence.",
        "department": "Academic Affairs",
    },
    {
        "email": "principal.demo@sbjit.edu.in",
        "role": "Principal",
        "first_name": "Dr. Narendra",
        "last_name": "Choudhary",
        "bio": "Principal of SBJIT directing institutional governance and strategic development.",
        "department": "Executive Leadership",
    },
    {
        "email": "principal@sbjit.edu.in",
        "role": "Principal",
        "first_name": "Dr. Narendra",
        "last_name": "Choudhary",
        "bio": "Principal of SBJIT directing institutional governance and strategic development.",
        "department": "Executive Leadership",
    },
    {
        "email": "ceo.demo@sbjit.edu.in",
        "role": "CEO",
        "first_name": "Shri. Ramesh",
        "last_name": "Singhania",
        "bio": "Chief Executive Officer guiding institutional expansion, vision, and strategic campus roadmap.",
        "department": "Board of Governors",
    },
    {
        "email": "ceo@sbjit.edu.in",
        "role": "CEO",
        "first_name": "Shri. Ramesh",
        "last_name": "Singhania",
        "bio": "Chief Executive Officer guiding institutional expansion, vision, and strategic campus roadmap.",
        "department": "Board of Governors",
    },
]


async def seed_demo_users():
    print("Seeding pre-configured Demo Accounts for all roles...")
    default_password = "password123"
    async with SessionLocal() as db:
        for item in DEMO_USERS:
            clean_email = item["email"].strip().lower()
            role_name = item["role"]
            user_password = item.get("password", default_password)

            role_stmt = select(Role).filter(Role.name == role_name)
            role_res = await db.execute(role_stmt)
            role_obj = role_res.scalars().first()

            if not role_obj:
                print(f"Role {role_name} not found, creating...")
                role_obj = Role(
                    name=role_name, permissions=ROLES_DATA.get(role_name, [])
                )
                db.add(role_obj)
                await db.flush()

            user_stmt = select(User).filter(User.email.ilike(clean_email))
            user_res = await db.execute(user_stmt)
            existing_user = user_res.scalars().first()

            if not existing_user:
                print(f"Creating demo user: {clean_email} ({role_name})...")
                new_user = User(
                    email=clean_email,
                    hashed_password=hash_password(user_password),
                    role_id=role_obj.id,
                    is_active=True,
                    is_verified=True,
                )
                db.add(new_user)
                await db.flush()

                profile = Profile(
                    user_id=new_user.id,
                    first_name=item["first_name"],
                    last_name=item["last_name"],
                    bio=item["bio"],
                    department=item["department"],
                )
                db.add(profile)
            else:
                existing_user.role_id = role_obj.id
                existing_user.is_active = True
                existing_user.is_verified = True
                existing_user.hashed_password = hash_password(user_password)

        await db.commit()
    print("All Demo Accounts seeded successfully.")


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
        await seed_demo_users()
        print("All database seeding tasks completed successfully.")


if __name__ == "__main__":
    asyncio.run(main())
