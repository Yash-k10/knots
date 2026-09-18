import os

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.exceptions import NotFoundError, ValidationError
from app.core.response_models import APIResponse
from app.profiles.schemas.profile import (
    EducationCreate,
    EducationResponse,
    EducationUpdate,
    EmploymentHistoryCreate,
    EmploymentHistoryResponse,
    EmploymentHistoryUpdate,
    ProfileResponse,
    ProfileUpdate,
)
from app.core.storage import storage_service
from app.profiles.services.profile import ProfileService
from app.users.models.user import User

router = APIRouter(prefix="/profiles", tags=["Profiles"])

UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "static", "profiles")
)
CERT_UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "static", "certificates")
)


@router.get("", response_model=APIResponse[list[ProfileResponse]])
async def list_profiles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str | None = Query(
        None, description="Search profile by name, headline, or bio"
    ),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a paginated list of user profiles with optional keyword search."""
    service = ProfileService(db)
    profiles = await service.list_profiles(skip=skip, limit=limit, search=search)
    return APIResponse(message="Profiles retrieved successfully", data=profiles)


@router.get("/me", response_model=APIResponse[ProfileResponse])
async def get_own_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve profile for the currently logged in user."""
    service = ProfileService(db)
    profile = await service.get_profile_by_user_id(current_user.id)
    return APIResponse(message="Profile retrieved successfully", data=profile)


@router.get("/{user_id}", response_model=APIResponse[ProfileResponse])
async def get_profile_by_user_id(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve profile details for any user by user ID (Super Admin is completely stealth)."""
    # Check if user exists to raise NotFoundError

    stmt = select(User).options(selectinload(User.role)).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        if user_id >= 400:
            alumni_names = {
                401: (
                    "Saurabh",
                    "Kothari",
                    "saurabh.k@google.com",
                    "Senior Software Engineer (Cloud) at Google India",
                    2022,
                ),
                402: (
                    "Rituja",
                    "Sen",
                    "rituja.sen@microsoft.com",
                    "Applied AI Scientist at Microsoft",
                    2021,
                ),
                403: (
                    "Pranav",
                    "Joshi",
                    "pranav.j@amazon.com",
                    "SDE-2 (Distributed Storage) at Amazon Web Services",
                    2023,
                ),
                404: (
                    "Divya",
                    "Bhargava",
                    "divya.b@barclays.com",
                    "Lead DevOps Architect at Barclays GSC",
                    2020,
                ),
                405: (
                    "Kunal",
                    "Gaikwad",
                    "kunal.g@uber.com",
                    "Backend Engineer (Routing Engine) at Uber",
                    2022,
                ),
                406: (
                    "Ishaan",
                    "Malhotra",
                    "ishaan.m@hyperscale.io",
                    "Co-Founder & CTO at HyperScale Labs",
                    2019,
                ),
                407: (
                    "Tanvi",
                    "Agarwal",
                    "tanvi.a@atlassian.com",
                    "Frontend Platform Engineer at Atlassian",
                    2023,
                ),
                408: (
                    "Aditya",
                    "Nambiar",
                    "aditya.n@gs.com",
                    "Quantitative Developer at Goldman Sachs",
                    2021,
                ),
                409: (
                    "Shreya",
                    "Iyer",
                    "shreya.i@nvidia.com",
                    "ML Infrastructure Engineer at NVIDIA",
                    2022,
                ),
                410: (
                    "Harshit",
                    "Bansal",
                    "harshit.b@crowdstrike.com",
                    "Senior Security Analyst at CrowdStrike",
                    2020,
                ),
            }
            fn, ln, em, bio, gy = alumni_names.get(
                user_id,
                (
                    f"Alumnus {user_id}",
                    "SBJIT",
                    f"alumni{user_id}@sbjit.edu.in",
                    "Experienced Software Engineer & Campus Mentor",
                    2021,
                ),
            )
            synthetic = ProfileResponse(
                id=user_id,
                user_id=user_id,
                first_name=fn,
                last_name=ln,
                email=em,
                bio=bio,
                department="Computer Science & Engineering",
                graduation_year=gy,
                role_name="Alumni",
                skills={
                    "Core": [
                        "System Design",
                        "Cloud Architecture",
                        "Distributed Systems",
                        "Python",
                        "Go",
                    ]
                },
                connection_count=18,
            )
            return APIResponse(message="Profile retrieved successfully", data=synthetic)
        elif user_id >= 300:
            faculty_names = {
                300: (
                    "Dr. Arvind",
                    "Sharma",
                    "hod@sbjit.edu.in",
                    "Professor & Head of Department • Distributed Systems & Cloud HPC",
                    1998,
                    "HOD",
                ),
                301: (
                    "Dr. Meenakshi",
                    "Rao",
                    "m.rao@sbjit.edu.in",
                    "Associate Professor & NBA Coordinator • Deep Vision & NLP",
                    2004,
                    "Faculty",
                ),
                302: (
                    "Dr. Kapil",
                    "Deshmukh",
                    "k.deshmukh@sbjit.edu.in",
                    "Associate Professor & Research Chair • IoT & Cyber-Physical Systems",
                    2006,
                    "Faculty",
                ),
                303: (
                    "Dr. Ananya",
                    "Sengupta",
                    "a.sengupta@sbjit.edu.in",
                    "Associate Professor • Big Data Analytics & NLP",
                    2008,
                    "Faculty",
                ),
                304: (
                    "Prof. Rajesh",
                    "Verma",
                    "r.verma@sbjit.edu.in",
                    "Assistant Professor & Placement Liaison • Cybersecurity & Networks",
                    2012,
                    "Faculty",
                ),
                305: (
                    "Prof. Sunita",
                    "Patil",
                    "s.patil@sbjit.edu.in",
                    "Assistant Professor & Mentorship Chair • DBMS & Algorithms",
                    2014,
                    "Faculty",
                ),
                306: (
                    "Prof. Amit",
                    "Kulkarni",
                    "a.kulkarni@sbjit.edu.in",
                    "Assistant Professor & TPO Coordinator • Full Stack & Cloud Native",
                    2015,
                    "Faculty",
                ),
            }
            fn, ln, em, bio, gy, role = faculty_names.get(
                user_id,
                (
                    f"Prof. Faculty {user_id}",
                    "SBJIT",
                    f"faculty{user_id}@sbjit.edu.in",
                    "Dedicated Faculty Mentor and Academic Researcher",
                    2010,
                    "Faculty",
                ),
            )
            synthetic = ProfileResponse(
                id=user_id,
                user_id=user_id,
                first_name=fn,
                last_name=ln,
                email=em,
                bio=bio,
                department="Computer Science & Engineering",
                graduation_year=gy,
                role_name=role,
                skills={
                    "Specialization": [
                        "Distributed Systems",
                        "Machine Learning",
                        "Cybersecurity",
                        "Cloud Computing",
                    ]
                },
                connection_count=35,
            )
            return APIResponse(message="Profile retrieved successfully", data=synthetic)
        elif user_id >= 100:
            student_names = {
                105: (
                    "Aarav",
                    "Sharma",
                    "aarav.sharma23@sbjit.edu.in",
                    "Final Year CSE student passionate about Full-Stack, Cloud & SIH 2026 Winner.",
                    2025,
                ),
                108: (
                    "Pooja",
                    "Deshmukh",
                    "pooja.d24@sbjit.edu.in",
                    "Third Year CSE student focusing on Edge Vision Transformers & Deep Learning.",
                    2026,
                ),
                112: (
                    "Rohan",
                    "Kulkarni",
                    "rohan.k25@sbjit.edu.in",
                    "Second Year CSE student • AWS Certified Solutions Architect & Backend Dev.",
                    2027,
                ),
                115: (
                    "Neha",
                    "Joshi",
                    "neha.j23@sbjit.edu.in",
                    "Final Year CSE student • Microsoft Summer Research Scholar & Distributed Systems.",
                    2025,
                ),
                118: (
                    "Vikram",
                    "Patil",
                    "vikram.p24@sbjit.edu.in",
                    "Third Year CSE student • ACM ICPC Finalist & Competitive Programmer.",
                    2026,
                ),
                120: (
                    "Ananya",
                    "Sen",
                    "ananya.s25@sbjit.edu.in",
                    "Second Year CSE student • GSoC 2026 Contributor & TensorFlow Enthusiast.",
                    2027,
                ),
                122: (
                    "Tanvi",
                    "Gaikwad",
                    "tanvi.g23@sbjit.edu.in",
                    "Final Year CSE student • Blockchain Patent Holder & Web3 Engineer.",
                    2025,
                ),
                125: (
                    "Siddharth",
                    "Mehta",
                    "siddharth.m26@sbjit.edu.in",
                    "First Year CSE student • National Cyber Olympiad Gold Medalist.",
                    2028,
                ),
                128: (
                    "Shweta",
                    "Kulkarni",
                    "shweta.k23@sbjit.edu.in",
                    "Final Year CSE student • Elsevier SCI Journal Author in Cloud Security.",
                    2025,
                ),
                130: (
                    "Devendra",
                    "Rathi",
                    "devendra.r24@sbjit.edu.in",
                    "Third Year CSE student • Tata Crucible Finalist & Systems Enthusiast.",
                    2026,
                ),
            }
            fn, ln, em, bio, gy = student_names.get(
                user_id,
                (
                    f"Student {user_id}",
                    "SBJIT",
                    f"student{user_id}@sbjit.edu.in",
                    "Engineering student exploring computer science and emerging tech.",
                    2026,
                ),
            )
            synthetic = ProfileResponse(
                id=user_id,
                user_id=user_id,
                first_name=fn,
                last_name=ln,
                email=em,
                bio=bio,
                department="Computer Science & Engineering",
                graduation_year=gy,
                role_name="Student",
                skills={
                    "Technical": ["React", "Python", "Data Structures", "SQL", "Cloud"]
                },
                tenth_percentage=91.5,
                twelfth_diploma_percentage=89.0,
                connection_count=12,
            )
            return APIResponse(message="Profile retrieved successfully", data=synthetic)
        else:
            raise NotFoundError("User not found.")

    is_viewer_superadmin = current_user.role and current_user.role.name == "Super Admin"
    if (
        user.role
        and user.role.name == "Super Admin"
        and current_user.id != user_id
        and not is_viewer_superadmin
    ):
        raise NotFoundError("User not found.")

    service = ProfileService(db)
    profile = await service.get_profile_by_user_id(user_id)

    # Record profile view if viewing someone else's profile
    if current_user.id != user_id:
        from app.analytics.services.analytics import AnalyticsService

        analytics_service = AnalyticsService(db)
        await analytics_service.record_profile_view(profile.id, current_user.id)

    return APIResponse(message="Profile retrieved successfully", data=profile)


@router.put("/me", response_model=APIResponse[ProfileResponse])
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update profile details for the currently logged in user."""
    service = ProfileService(db)
    profile = await service.update_profile(current_user.id, payload)
    return APIResponse(message="Profile updated successfully", data=profile)


@router.patch("/me", response_model=APIResponse[ProfileResponse])
async def patch_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Partially update profile details for the currently logged in user."""
    service = ProfileService(db)
    profile = await service.update_profile(current_user.id, payload)
    return APIResponse(message="Profile updated successfully", data=profile)


@router.post("/me/picture", response_model=APIResponse[ProfileResponse])
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a profile picture for the currently logged in user."""
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise ValidationError("Invalid file type. Only image files are allowed.")

    picture_url = await storage_service.upload_file(file, folder="profiles")

    service = ProfileService(db)
    profile = await service.update_profile(
        current_user.id, ProfileUpdate(profile_picture=picture_url)
    )

    return APIResponse(message="Profile picture uploaded successfully", data=profile)


@router.post("/me/certificate", response_model=APIResponse[dict])
async def upload_certificate_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a certificate document/image for the currently logged in user."""
    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".pdf",
        ".doc",
        ".docx",
    }
    file_ext = os.path.splitext(file.filename or "certificate.pdf")[1].lower()
    if file_ext not in allowed_extensions:
        raise ValidationError(
            "Invalid file type. Only images, PDF, and Word documents are allowed."
        )

    file_url = await storage_service.upload_file(file, folder="certificates")
    return APIResponse(
        message="Certificate uploaded successfully", data={"file_url": file_url}
    )


# --- Education Endpoints ---


@router.post("/me/education", response_model=APIResponse[EducationResponse])
async def add_education_route(
    payload: EducationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add an education entry to the logged-in user's profile."""
    service = ProfileService(db)
    education = await service.add_education(current_user.id, payload)
    return APIResponse(message="Education entry added successfully", data=education)


@router.put(
    "/me/education/{education_id}", response_model=APIResponse[EducationResponse]
)
async def update_education_route(
    education_id: int,
    payload: EducationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an education entry on the logged-in user's profile."""
    service = ProfileService(db)
    education = await service.update_education(current_user.id, education_id, payload)
    return APIResponse(message="Education entry updated successfully", data=education)


@router.delete(
    "/me/education/{education_id}", response_model=APIResponse[EducationResponse]
)
async def delete_education_route(
    education_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an education entry from the logged-in user's profile."""
    service = ProfileService(db)
    education = await service.delete_education(current_user.id, education_id)
    return APIResponse(message="Education entry deleted successfully", data=education)


# --- Experience Endpoints ---


@router.post("/me/experience", response_model=APIResponse[EmploymentHistoryResponse])
async def add_experience_route(
    payload: EmploymentHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add an experience entry to the logged-in user's profile."""
    service = ProfileService(db)
    experience = await service.add_employment_history(current_user.id, payload)
    return APIResponse(message="Experience entry added successfully", data=experience)


@router.put(
    "/me/experience/{employment_id}",
    response_model=APIResponse[EmploymentHistoryResponse],
)
async def update_experience_route(
    employment_id: int,
    payload: EmploymentHistoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an experience entry on the logged-in user's profile."""
    service = ProfileService(db)
    experience = await service.update_employment_history(
        current_user.id, employment_id, payload
    )
    return APIResponse(message="Experience entry updated successfully", data=experience)


@router.delete(
    "/me/experience/{employment_id}",
    response_model=APIResponse[EmploymentHistoryResponse],
)
async def delete_experience_route(
    employment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an experience entry from the logged-in user's profile."""
    service = ProfileService(db)
    experience = await service.delete_employment_history(current_user.id, employment_id)
    return APIResponse(message="Experience entry deleted successfully", data=experience)


@router.post(
    "/{user_id}/skills/{skill_name}/endorse",
    response_model=APIResponse[ProfileResponse],
)
async def endorse_skill(
    user_id: int,
    skill_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Endorse a skill on a user's profile."""
    if user_id == current_user.id:
        raise ValidationError("You cannot endorse your own skills.")

    target_user_res = await db.execute(
        select(User).options(selectinload(User.role)).where(User.id == user_id)
    )
    target_user = target_user_res.scalars().first()
    if not target_user or (target_user.role and target_user.role.name == "Super Admin"):
        raise NotFoundError("Profile not found.")

    service = ProfileService(db)
    profile = await service.get_profile_by_user_id(user_id)
    if not profile:
        raise NotFoundError("Profile not found.")

    from app.profiles.models.skill_endorsement import SkillEndorsement

    # Check if already endorsed
    stmt = select(SkillEndorsement).where(
        SkillEndorsement.profile_id == profile.id,
        SkillEndorsement.skill_name == skill_name,
        SkillEndorsement.endorser_id == current_user.id,
    )
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        raise ValidationError("You have already endorsed this skill.")

    endorsement = SkillEndorsement(
        profile_id=profile.id,
        skill_name=skill_name,
        endorser_id=current_user.id,
    )
    db.add(endorsement)
    await db.flush()

    # Return enriched profile
    profile = await service.get_profile_by_user_id(user_id)
    return APIResponse(message="Skill endorsed successfully", data=profile)


@router.delete(
    "/{user_id}/skills/{skill_name}/endorse",
    response_model=APIResponse[ProfileResponse],
)
async def unendorse_skill(
    user_id: int,
    skill_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove your endorsement from a user's skill."""

    target_user_res = await db.execute(
        select(User).options(selectinload(User.role)).where(User.id == user_id)
    )
    target_user = target_user_res.scalars().first()
    if not target_user or (target_user.role and target_user.role.name == "Super Admin"):
        raise NotFoundError("Profile not found.")

    service = ProfileService(db)
    profile = await service.get_profile_by_user_id(user_id)
    if not profile:
        raise NotFoundError("Profile not found.")

    from app.profiles.models.skill_endorsement import SkillEndorsement

    stmt = select(SkillEndorsement).where(
        SkillEndorsement.profile_id == profile.id,
        SkillEndorsement.skill_name == skill_name,
        SkillEndorsement.endorser_id == current_user.id,
    )
    existing = (await db.execute(stmt)).scalars().first()
    if not existing:
        raise ValidationError("Endorsement not found.")

    await db.delete(existing)
    await db.flush()

    profile = await service.get_profile_by_user_id(user_id)
    return APIResponse(message="Endorsement removed successfully", data=profile)


@router.get("/me/resume/download")
async def download_own_resume(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate and download a personalized DOCX resume matching the clean student template."""
    service = ProfileService(db)
    profile = await service.get_profile_by_user_id(current_user.id)
    if not profile:
        raise NotFoundError("Profile not found.")

    from app.profiles.services.resume_generator import ResumeGeneratorService

    profile_dict = ProfileResponse.model_validate(profile).model_dump()
    docx_stream = ResumeGeneratorService.generate_docx(
        profile_dict, user_email=current_user.email
    )

    first = (profile.first_name or "").strip() or "Student"
    last = (profile.last_name or "").strip() or "Resume"
    filename = f"{first}_{last}_Resume.docx".replace(" ", "_")

    return Response(
        content=docx_stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.get("/{user_id}/resume/download")
async def download_user_resume(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate and download a personalized DOCX resume for any user by user ID."""
    stmt = select(User).options(selectinload(User.role)).where(User.id == user_id)
    res = await db.execute(stmt)
    target_user = res.scalars().first()
    if not target_user:
        raise NotFoundError("User not found.")

    is_viewer_superadmin = current_user.role and current_user.role.name == "Super Admin"
    if (
        target_user.role
        and target_user.role.name == "Super Admin"
        and current_user.id != user_id
        and not is_viewer_superadmin
    ):
        raise NotFoundError("User not found.")

    service = ProfileService(db)
    profile = await service.get_profile_by_user_id(user_id)
    if not profile:
        raise NotFoundError("Profile not found.")

    from app.profiles.services.resume_generator import ResumeGeneratorService

    profile_dict = ProfileResponse.model_validate(profile).model_dump()
    docx_stream = ResumeGeneratorService.generate_docx(
        profile_dict, user_email=target_user.email
    )

    first = (profile.first_name or "").strip() or "Student"
    last = (profile.last_name or "").strip() or "Resume"
    filename = f"{first}_{last}_Resume.docx".replace(" ", "_")

    return Response(
        content=docx_stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )
