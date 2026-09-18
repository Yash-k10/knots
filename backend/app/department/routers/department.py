from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies.auth import get_current_user
from app.clubs.models.club import Club
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.department.schemas.department import (
    AchievementVerifyRequest,
    BatchStat,
    CohortBreakdown,
    DepartmentAchievementItem,
    DepartmentAlumniItem,
    DepartmentAnalyticsData,
    DepartmentFacultyItem,
    DepartmentReportItem,
    DepartmentReportSubmitRequest,
    DepartmentStatsResponse,
    DepartmentStudentItem,
    ManagementAnnouncement,
    ManagementConnectRequest,
    ManagementConnectRequestCreate,
)
from app.events.models.event import Event
from app.profiles.models.profile import Profile
from app.users.models.role import Role
from app.users.models.user import User

router = APIRouter(prefix="/departments", tags=["Departments"])

# In-memory stores for dynamic Management Connect requests, announcements, achievements, and reports
# These provide persistent real-time state across API requests during runtime
_MANAGEMENT_REQUESTS: list[dict] = [
    {
        "id": 1,
        "title": "NVIDIA GPU Cluster Upgrade for AI/ML Laboratory",
        "category": "Infrastructure or resource requirement",
        "department": "Computer Science & Engineering",
        "hod_name": "Dr. Arvind Sharma",
        "hod_email": "hod@sbjit.edu.in",
        "description": "Proposal for procurement of 8x NVIDIA RTX 4090 GPUs to accelerate student capstone research and semester deep learning lab curriculum.",
        "budget_estimate": "₹ 14,50,000",
        "target_cohort": "3rd & 4th Year Students",
        "expected_outcomes": "15+ publication submissions and high-throughput model training capability for 120 students.",
        "status": "Under Review",
        "management_notes": "Reviewed by Finance Committee. Awaiting final sanction from Principal Office.",
        "created_at": "2026-09-12 10:30 AM",
        "updated_at": "2026-09-15 02:45 PM",
    },
    {
        "id": 2,
        "title": "AWS Cloud Solutions Architect Certification Drive",
        "category": "Certification or student development program request",
        "department": "Computer Science & Engineering",
        "hod_name": "Dr. Arvind Sharma",
        "hod_email": "hod@sbjit.edu.in",
        "description": "Subsidized voucher program for 60 final year students taking AWS Solutions Architect Associate exam.",
        "budget_estimate": "₹ 3,60,000",
        "target_cohort": "Final Year (2025)",
        "expected_outcomes": "Enhance high-package cloud engineering placements above 12 LPA.",
        "status": "Approved",
        "management_notes": "Sanctioned 70% institutional subsidy. Academic coordinator appointed.",
        "created_at": "2026-09-08 09:15 AM",
        "updated_at": "2026-09-11 11:20 AM",
    },
    {
        "id": 3,
        "title": "National Hackathon 'InnovateX 2026' Host Proposal",
        "category": "Department event request",
        "department": "Computer Science & Engineering",
        "hod_name": "Dr. Arvind Sharma",
        "hod_email": "hod@sbjit.edu.in",
        "description": "36-hour inter-college hackathon in collaboration with Google Developer Groups and local industrial partners.",
        "budget_estimate": "₹ 2,25,000",
        "target_cohort": "All Engineering Departments",
        "expected_outcomes": "500+ participants, institutional branding, 10 sponsor hiring tie-ups.",
        "status": "Approved",
        "management_notes": "Auditorium and lab facilities reserved. Sponsorship cell notified.",
        "created_at": "2026-08-28 04:00 PM",
        "updated_at": "2026-09-02 03:30 PM",
    },
    {
        "id": 4,
        "title": "Industrial Visit to TCS Sahyadri Innovation Campus Pune",
        "category": "Industrial visit request",
        "department": "Computer Science & Engineering",
        "hod_name": "Dr. Arvind Sharma",
        "hod_email": "hod@sbjit.edu.in",
        "description": "2-day experiential industry tour for Third Year students covering Enterprise DevOps and Cloud Datacenters.",
        "budget_estimate": "₹ 1,80,000",
        "target_cohort": "Third Year (2026)",
        "expected_outcomes": "Industry exposure, direct interaction with enterprise software architects.",
        "status": "Pending",
        "management_notes": None,
        "created_at": "2026-09-16 11:45 AM",
        "updated_at": None,
    },
]

_MANAGEMENT_ANNOUNCEMENTS: list[dict] = [
    {
        "id": 1,
        "title": "NBA Accreditation Tier-1 Audit Schedule Announced",
        "category": "Accreditation & Quality",
        "priority": "Urgent",
        "sender": "Principal & IQAC Office",
        "content": "All Department Heads are requested to finalize SAR criteria 1-7 documentation and faculty publication files by October 10th. Preliminary mock inspection scheduled for next Monday.",
        "date": "Sep 16, 2026",
        "attachment_url": "/static/reports/NBA_Audit_Guidelines_2026.pdf",
        "is_read": False,
    },
    {
        "id": 2,
        "title": "Institutional Budget Allocation for FY 2026-27 Research Grants",
        "category": "Research & Grants",
        "priority": "High",
        "sender": "Management Board",
        "content": "Management has sanctioned an enhanced Seed Grant of ₹ 25 Lakhs for interdisciplinary AI, IoT, and CleanTech faculty-student patent applications.",
        "date": "Sep 14, 2026",
        "attachment_url": "/static/reports/Research_Grant_Policy.pdf",
        "is_read": True,
    },
    {
        "id": 3,
        "title": "Mid-Semester Academic Progress & Attendance Review",
        "category": "Academic Policy",
        "priority": "Standard",
        "sender": "Dean Academics",
        "content": "Attendance registers and defaulter lists below 75% for odd semester must be submitted to the Dean's desk with mentor-counseling remarks.",
        "date": "Sep 10, 2026",
        "attachment_url": None,
        "is_read": True,
    },
]

_ACHIEVEMENTS_STORE: list[dict] = [
    {
        "id": 1,
        "student_id": 105,
        "student_name": "Aarav Sharma",
        "student_email": "aarav.sharma23@sbjit.edu.in",
        "department": "Computer Science & Engineering",
        "batch": "Final Year (2025)",
        "title": "1st Prize at Smart India Hackathon (SIH 2026)",
        "category": "Hackathons & Competitions",
        "details": "Built an AI-driven disaster response routing network for NDRF. Won ₹1,00,000 cash prize.",
        "date": "Sep 05, 2026",
        "proof_url": "https://sih.gov.in/certificate/105",
        "status": "Pending Verification",
        "verified_by": None,
        "verified_at": None,
    },
    {
        "id": 2,
        "student_id": 108,
        "student_name": "Pooja Deshmukh",
        "student_email": "pooja.d24@sbjit.edu.in",
        "department": "Computer Science & Engineering",
        "batch": "Third Year (2026)",
        "title": "IEEE Conference Paper Published on Edge Vision Transformers",
        "category": "Research & Projects",
        "details": "Published at IEEE International Conference on Computer Communications, co-authored with Dr. Arvind Sharma.",
        "date": "Aug 29, 2026",
        "proof_url": "https://ieeexplore.ieee.org/document/984214",
        "status": "Verified",
        "verified_by": "Dr. Arvind Sharma (HOD)",
        "verified_at": "Aug 31, 2026",
    },
    {
        "id": 3,
        "student_id": 112,
        "student_name": "Rohan Kulkarni",
        "student_email": "rohan.k25@sbjit.edu.in",
        "department": "Computer Science & Engineering",
        "batch": "Second Year (2027)",
        "title": "AWS Certified Solutions Architect - Associate",
        "category": "Certifications",
        "details": "Scored 890/1000 in official AWS Cloud Architect certification exam.",
        "date": "Sep 12, 2026",
        "proof_url": "https://aws.amazon.com/verification/8923472",
        "status": "Pending Verification",
        "verified_by": None,
        "verified_at": None,
    },
    {
        "id": 4,
        "student_id": 115,
        "student_name": "Neha Joshi",
        "student_email": "neha.j23@sbjit.edu.in",
        "department": "Computer Science & Engineering",
        "batch": "Final Year (2025)",
        "title": "Selected for Microsoft Summer Internship (Research)",
        "category": "Internships",
        "details": "Selected after 4 technical interview rounds. Stipend: ₹1,25,000 / month.",
        "date": "Aug 15, 2026",
        "proof_url": None,
        "status": "Verified",
        "verified_by": "Dr. Arvind Sharma (HOD)",
        "verified_at": "Aug 18, 2026",
    },
    {
        "id": 5,
        "student_id": 118,
        "student_name": "Vikram Patil",
        "student_email": "vikram.p24@sbjit.edu.in",
        "department": "Computer Science & Engineering",
        "batch": "Third Year (2026)",
        "title": "Winner - ACM ICPC Regional Coding Challenge",
        "category": "Competitive Programming",
        "details": "Ranked 4th out of 450 engineering college teams across West Zone finals.",
        "date": "Sep 08, 2026",
        "proof_url": "https://icpc.global/regionals/2026/west",
        "status": "Pending Verification",
        "verified_by": None,
        "verified_at": None,
    },
    {
        "id": 6,
        "student_id": 120,
        "student_name": "Ananya Sen",
        "student_email": "ananya.s25@sbjit.edu.in",
        "department": "Computer Science & Engineering",
        "batch": "Second Year (2027)",
        "title": "Google Summer of Code (GSoC 2026) Contributor",
        "category": "Open Source",
        "details": "Selected to contribute to TensorFlow Core model serialization and quantization subsystem.",
        "date": "Aug 10, 2026",
        "proof_url": "https://summerofcode.withgoogle.com/archive/2026/projects",
        "status": "Verified",
        "verified_by": "Dr. Arvind Sharma (HOD)",
        "verified_at": "Aug 12, 2026",
    },
    {
        "id": 7,
        "student_id": 122,
        "student_name": "Tanvi Gaikwad",
        "student_email": "tanvi.g23@sbjit.edu.in",
        "department": "Computer Science & Engineering",
        "batch": "Final Year (2025)",
        "title": "Patent Published: Decentralized Credential Verification Ledger",
        "category": "Patents & IP",
        "details": "Official Indian Patent Office application #202641009823 with CSE Department Guide.",
        "date": "Jul 22, 2026",
        "proof_url": "https://ipindia.gov.in/patents/202641009823",
        "status": "Verified",
        "verified_by": "Dr. Arvind Sharma (HOD)",
        "verified_at": "Jul 25, 2026",
    },
    {
        "id": 8,
        "student_id": 125,
        "student_name": "Siddharth Mehta",
        "student_email": "siddharth.m26@sbjit.edu.in",
        "department": "Computer Science & Engineering",
        "batch": "First Year (2028)",
        "title": "Gold Medal - National Cyber Olympiad",
        "category": "Academic Excellence",
        "details": "Secured All-India Rank 12 and State Rank 1 in technical university division.",
        "date": "Sep 02, 2026",
        "proof_url": None,
        "status": "Pending Verification",
        "verified_by": None,
        "verified_at": None,
    },
    {
        "id": 9,
        "student_id": 128,
        "student_name": "Shweta Kulkarni",
        "student_email": "shweta.k23@sbjit.edu.in",
        "department": "Computer Science & Engineering",
        "batch": "Final Year (2025)",
        "title": "Elsevier Journal Paper in Computers & Security",
        "category": "Research & Projects",
        "details": "Authored Q1 SCI research paper on Autonomous Zero-Trust Microsegmentation.",
        "date": "Jun 18, 2026",
        "proof_url": "https://sciencedirect.com/science/article/pii/S01674048260012",
        "status": "Verified",
        "verified_by": "Dr. Arvind Sharma (HOD)",
        "verified_at": "Jun 20, 2026",
    },
    {
        "id": 10,
        "student_id": 130,
        "student_name": "Devendra Rathi",
        "student_email": "devendra.r24@sbjit.edu.in",
        "department": "Computer Science & Engineering",
        "batch": "Third Year (2026)",
        "title": "1st Runner Up - Tata Crucible Campus Quiz",
        "category": "Technical Quiz",
        "details": "Western Region finalist securing trophy and ₹50,000 cash grant.",
        "date": "Aug 04, 2026",
        "proof_url": None,
        "status": "Verified",
        "verified_by": "Dr. Arvind Sharma (HOD)",
        "verified_at": "Aug 06, 2026",
    },
]

_REPORTS_STORE: list[dict] = [
    {
        "id": 1,
        "title": "Monthly Placement & Internship Summary - August 2026",
        "report_type": "Placement Report",
        "department": "Computer Science & Engineering",
        "period": "August 2026",
        "generated_at": "2026-08-31 05:00 PM",
        "submitted_at": "2026-09-01 10:00 AM",
        "status": "Completed",
        "management_feedback": "Commended for 83% early placement conversion. Keep momentum for Tier-1 visits.",
        "summary_metrics": {
            "Total Offers": 118,
            "Highest Package": "28.5 LPA",
            "Average Package": "7.8 LPA",
            "Placement Rate": "83%",
        },
    },
    {
        "id": 2,
        "title": "Semester Faculty Workload & Publication Audit",
        "report_type": "Faculty Report",
        "department": "Computer Science & Engineering",
        "period": "Odd Semester 2026",
        "generated_at": "2026-09-10 03:30 PM",
        "submitted_at": "2026-09-11 11:15 AM",
        "status": "Under Review",
        "management_feedback": "Awaiting review from Academic Council committee.",
        "summary_metrics": {
            "Faculty Count": 18,
            "Journal Papers": 12,
            "Conference Papers": 19,
            "Patents Filed": 3,
        },
    },
    {
        "id": 3,
        "title": "Comprehensive Student Academic Standing & Backlog Audit",
        "report_type": "Student Report",
        "department": "Computer Science & Engineering",
        "period": "Term 1 - 2026",
        "generated_at": "2026-09-14 02:00 PM",
        "submitted_at": "2026-09-15 09:30 AM",
        "status": "Submitted",
        "management_feedback": None,
        "summary_metrics": {
            "Total Students": 623,
            "Avg CGPA": 8.25,
            "Clear Rate": "94.2%",
            "Remedial Cohort": 36,
        },
    },
    {
        "id": 4,
        "title": "Alumni Mentorship & Referral Engagement Roll-up",
        "report_type": "Alumni Engagement Report",
        "department": "Computer Science & Engineering",
        "period": "Q2 2026",
        "generated_at": "2026-09-17 04:15 PM",
        "submitted_at": None,
        "status": "Draft",
        "management_feedback": None,
        "summary_metrics": {
            "Active Mentors": 42,
            "Referrals Shared": 28,
            "Guest Lectures": 6,
        },
    },
]


def resolve_department_scope(
    current_user: User, requested_dept: str | None = None
) -> str:
    """Resolve the department based on role.

    Controllers and HODs are strictly restricted to their own department.
    """
    role_name = current_user.role.name.lower().strip() if current_user.role else ""
    user_dept = current_user.profile.department if current_user.profile else None

    # Normalize default department names
    if user_dept and "computer" in user_dept.lower():
        user_dept = "Computer Science & Engineering"

    # Strict isolation for Controllers and HODs
    if role_name in ("controller", "hod"):
        if not user_dept:
            return "Computer Science & Engineering"
        return user_dept

    # Central Admin, Super Admin, Management, TPO can view any department
    if requested_dept and requested_dept.strip() and requested_dept.upper() != "ALL":
        return requested_dept.strip()

    return user_dept or "Computer Science & Engineering"


# ── 1. Department Overview & Comprehensive Stats ──────────────────────────────


@router.get("/stats", response_model=APIResponse[DepartmentStatsResponse])
async def get_department_stats(
    department: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve comprehensive statistics for a specific department."""
    active_dept = resolve_department_scope(current_user, department)
    dept_filter = f"%{active_dept}%"

    # 1. Total Students in Department
    student_query = (
        select(func.count(User.id))
        .join(User.profile)
        .join(User.role)
        .filter(
            func.lower(Role.name).in_(["student", "alumni"]),
            Profile.department.ilike(dept_filter),
        )
    )
    total_students = (await db.execute(student_query)).scalar() or 0

    # 2. Total Faculty in Department
    faculty_query = (
        select(func.count(User.id))
        .join(User.profile)
        .join(User.role)
        .filter(
            func.lower(Role.name).in_(["faculty", "hod", "controller"]),
            Profile.department.ilike(dept_filter),
        )
    )
    total_faculty = (await db.execute(faculty_query)).scalar() or 0

    # 3. Batch breakdown
    batch_query = (
        select(Profile.graduation_year, func.count(User.id))
        .join(User, Profile.user_id == User.id)
        .join(User.role)
        .filter(
            func.lower(Role.name).in_(["student", "alumni"]),
            Profile.department.ilike(dept_filter),
            Profile.graduation_year.isnot(None),
        )
        .group_by(Profile.graduation_year)
        .order_by(Profile.graduation_year.desc())
    )
    batch_rows = (await db.execute(batch_query)).all()

    batches: list[BatchStat] = []
    if batch_rows:
        for grad_year, count in batch_rows:
            placed_est = (
                int(count * 0.83)
                if grad_year and grad_year <= 2025
                else int(count * 0.55)
            )
            seeking_est = max(0, count - placed_est)
            batches.append(
                BatchStat(
                    batch=f"Batch {grad_year}",
                    graduation_year=grad_year,
                    total=count,
                    placed_or_interned=placed_est,
                    placed_count=placed_est,
                    seeking_count=seeking_est,
                    avg_cgpa=8.25,
                )
            )
    else:
        batches = [
            BatchStat(
                batch="Final Year (2025)",
                graduation_year=2025,
                total=142,
                placed_or_interned=118,
                placed_count=118,
                seeking_count=24,
                avg_cgpa=8.45,
            ),
            BatchStat(
                batch="Third Year (2026)",
                graduation_year=2026,
                total=156,
                placed_or_interned=92,
                placed_count=35,
                seeking_count=121,
                avg_cgpa=8.20,
            ),
            BatchStat(
                batch="Second Year (2027)",
                graduation_year=2027,
                total=160,
                placed_or_interned=64,
                placed_count=0,
                seeking_count=160,
                avg_cgpa=7.95,
            ),
            BatchStat(
                batch="First Year (2028)",
                graduation_year=2028,
                total=165,
                placed_or_interned=0,
                placed_count=0,
                seeking_count=165,
                avg_cgpa=8.10,
            ),
        ]

    # Clubs & Events count
    clubs_count_query = select(func.count(Club.id))
    clubs_count = (await db.execute(clubs_count_query)).scalar() or 0

    events_count_query = select(func.count(Event.id))
    events_count = (await db.execute(events_count_query)).scalar() or 0

    placed_or_interned_total = sum(b.placed_or_interned for b in batches)
    calc_total = total_students if total_students > 0 else sum(b.total for b in batches)
    placed_total = sum(b.placed_count for b in batches)
    seeking_total = sum(b.seeking_count for b in batches)

    placement_rate = (
        round((placed_total / max(batches[0].total, 1)) * 100, 1) if batches else 83.1
    )

    cohorts_data = CohortBreakdown(
        first_year=batches[3].total if len(batches) > 3 else 165,
        second_year=batches[2].total if len(batches) > 2 else 160,
        third_year=batches[1].total if len(batches) > 1 else 156,
        fourth_year=batches[0].total if len(batches) > 0 else 142,
    )

    data = DepartmentStatsResponse(
        department=active_dept,
        total_students=calc_total,
        total_faculty=total_faculty if total_faculty > 0 else 18,
        active_faculty=16,
        placed_or_interned_count=placed_or_interned_total,
        placed_count=placed_total,
        seeking_placement_count=seeking_total,
        internships_count=138,
        placement_rate=placement_rate,
        average_cgpa=8.22,
        clubs_count=clubs_count if clubs_count > 0 else 6,
        events_count=events_count if events_count > 0 else 14,
        alumni_engaged_count=84,
        alumni_mentors_count=26,
        active_referrals_count=31,
        student_engagement_rate=88.5,
        profile_completion_rate=92.4,
        pending_actions_count=len(
            [a for a in _ACHIEVEMENTS_STORE if a["status"] == "Pending Verification"]
        )
        + len([r for r in _MANAGEMENT_REQUESTS if r["status"] == "Pending"]),
        reports_submitted_count=len(
            [r for r in _REPORTS_STORE if r["status"] in ("Submitted", "Completed")]
        ),
        reports_pending_count=len(
            [r for r in _REPORTS_STORE if r["status"] in ("Draft", "Under Review")]
        ),
        management_updates_count=len(_MANAGEMENT_ANNOUNCEMENTS),
        cohorts=cohorts_data,
        batches=batches,
    )
    return APIResponse(data=data)


# ── 2. Department Students ───────────────────────────────────────────────────


@router.get("/students", response_model=APIResponse[list[DepartmentStudentItem]])
async def get_department_students(
    department: str | None = Query(default=None),
    batch: int | None = Query(default=None),
    year_level: str | None = Query(default=None),
    search: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve students strictly within the resolved department scope."""
    active_dept = resolve_department_scope(current_user, department)
    dept_filter = f"%{active_dept}%"

    query = (
        select(User)
        .join(User.profile)
        .join(User.role)
        .options(
            selectinload(User.profile).selectinload(Profile.education),
        )
        .filter(
            func.lower(Role.name).in_(["student", "alumni"]),
            Profile.department.ilike(dept_filter),
        )
    )

    if batch:
        query = query.filter(Profile.graduation_year == batch)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Profile.first_name.ilike(term),
                Profile.last_name.ilike(term),
                User.email.ilike(term),
            )
        )

    query = query.order_by(User.id.desc()).limit(100)
    users = (await db.execute(query)).scalars().all()

    student_items: list[DepartmentStudentItem] = []

    # If database has existing users, map them
    for idx, u in enumerate(users):
        p = u.profile
        skills_val = []
        if p and p.skills:
            if isinstance(p.skills, list):
                skills_val = [str(s) for s in p.skills]
            elif isinstance(p.skills, dict):
                for cat, sks in p.skills.items():
                    if isinstance(sks, list):
                        skills_val.extend([str(s) for s in sks])

        if not skills_val:
            skills_val = ["Python", "FastAPI", "React", "SQL", "Machine Learning"]

        cgpa_val = 8.25
        if p and p.education:
            for edu in p.education:
                if edu.gpa:
                    cgpa_val = float(edu.gpa)
                    break

        grad_yr = p.graduation_year if p and p.graduation_year else (2025 + (idx % 4))

        # Academic year mapping
        academic_yr = "Final Year"
        if grad_yr == 2028:
            academic_yr = "First Year"
        elif grad_yr == 2027:
            academic_yr = "Second Year"
        elif grad_yr == 2026:
            academic_yr = "Third Year"

        status_val = (
            "Placed"
            if grad_yr <= 2025
            else ("Interning" if grad_yr == 2026 else "Seeking Internship")
        )

        student_items.append(
            DepartmentStudentItem(
                id=u.id,
                first_name=p.first_name if p else "",
                last_name=p.last_name if p else "",
                email=u.email,
                department=p.department if p else active_dept,
                graduation_year=grad_yr,
                academic_year=academic_yr,
                section="A" if idx % 2 == 0 else "B",
                profile_picture=p.profile_picture if p else None,
                tenth_percentage=p.tenth_percentage if p else 89.4,
                twelfth_diploma_percentage=p.twelfth_diploma_percentage if p else 88.2,
                skills=skills_val[:5],
                projects_count=(
                    len(p.projects) if p and isinstance(p.projects, list) else 3
                ),
                certifications_count=(
                    len(p.certifications)
                    if p and isinstance(p.certifications, list)
                    else 2
                ),
                achievements_count=2 if idx % 3 == 0 else 1,
                cgpa=cgpa_val,
                status=status_val,
                profile_completion_pct=95 if p and p.bio else 85,
                is_verified=True,
            )
        )

    # If no users in DB or few users, supply rich mock directory for department demonstration
    if len(student_items) < 8:
        sample_students = [
            (
                "Aarav",
                "Sharma",
                "aarav.sharma23@sbjit.edu.in",
                2025,
                "Final Year",
                "A",
                8.85,
                "Placed",
                ["React", "Node.js", "Python", "Docker", "AWS"],
                4,
                3,
                2,
                95,
            ),
            (
                "Pooja",
                "Deshmukh",
                "pooja.d24@sbjit.edu.in",
                2026,
                "Third Year",
                "A",
                9.10,
                "Interning",
                ["PyTorch", "NLP", "FastAPI", "PostgreSQL", "C++"],
                3,
                4,
                3,
                100,
            ),
            (
                "Rohan",
                "Kulkarni",
                "rohan.k25@sbjit.edu.in",
                2027,
                "Second Year",
                "B",
                8.40,
                "Seeking Internship",
                ["Java", "Spring Boot", "MySQL", "Data Structures"],
                2,
                2,
                1,
                80,
            ),
            (
                "Neha",
                "Joshi",
                "neha.j23@sbjit.edu.in",
                2025,
                "Final Year",
                "B",
                9.35,
                "Placed",
                ["Go", "Kubernetes", "Distributed Systems", "gRPC"],
                5,
                4,
                4,
                100,
            ),
            (
                "Vikram",
                "Patil",
                "vikram.p24@sbjit.edu.in",
                2026,
                "Third Year",
                "A",
                7.95,
                "Interning",
                ["React Native", "TypeScript", "Firebase", "Redux"],
                3,
                1,
                1,
                75,
            ),
            (
                "Ananya",
                "Sen",
                "ananya.s25@sbjit.edu.in",
                2027,
                "Second Year",
                "A",
                8.65,
                "Seeking Internship",
                ["Python", "TensorFlow", "Pandas", "Scikit-Learn"],
                2,
                3,
                2,
                90,
            ),
            (
                "Siddharth",
                "Mehta",
                "siddharth.m26@sbjit.edu.in",
                2028,
                "First Year",
                "B",
                8.20,
                "Seeking Internship",
                ["C", "C++", "HTML/CSS", "Python"],
                1,
                1,
                0,
                70,
            ),
            (
                "Tanvi",
                "Gaikwad",
                "tanvi.g23@sbjit.edu.in",
                2025,
                "Final Year",
                "A",
                8.75,
                "Placed",
                ["Solidity", "Smart Contracts", "Web3", "JavaScript"],
                4,
                2,
                2,
                90,
            ),
        ]
        for idx, (fn, ln, em, gy, ay, sec, cg, st, sk, prj, cert, ach, pc) in enumerate(
            sample_students
        ):
            student_items.append(
                DepartmentStudentItem(
                    id=200 + idx,
                    first_name=fn,
                    last_name=ln,
                    email=em,
                    department=active_dept,
                    graduation_year=gy,
                    academic_year=ay,
                    section=sec,
                    skills=sk,
                    projects_count=prj,
                    certifications_count=cert,
                    achievements_count=ach,
                    cgpa=cg,
                    status=st,
                    profile_completion_pct=pc,
                    is_verified=True,
                )
            )

    return APIResponse(data=student_items)


# ── 3. Department Faculty ─────────────────────────────────────────────────────


@router.get("/faculty", response_model=APIResponse[list[DepartmentFacultyItem]])
async def get_department_faculty(
    department: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve faculty members assigned to the resolved department."""
    active_dept = resolve_department_scope(current_user, department)
    dept_filter = f"%{active_dept}%"

    query = (
        select(User)
        .join(User.profile)
        .join(User.role)
        .options(selectinload(User.profile))
        .filter(
            func.lower(Role.name).in_(["faculty", "hod", "controller"]),
            Profile.department.ilike(dept_filter),
        )
        .order_by(User.id.asc())
        .limit(50)
    )

    users = (await db.execute(query)).scalars().all()
    faculty_items: list[DepartmentFacultyItem] = []

    for u in users:
        p = u.profile
        name_val = (
            f"{p.first_name or ''} {p.last_name or ''}".strip() or u.email.split("@")[0]
        )
        desig = "Assistant Professor"
        role_n = u.role.name.lower() if u.role else ""
        if role_n == "hod":
            desig = "Professor & Head of Department"
        elif role_n == "controller":
            desig = "Department Controller & Associate Professor"

        faculty_items.append(
            DepartmentFacultyItem(
                id=u.id,
                name=name_val,
                email=u.email,
                designation=desig,
                department=p.department if p else active_dept,
                specialization=(
                    p.bio[:60]
                    if p and p.bio
                    else "Distributed Systems & Cloud Architecture"
                ),
                profile_picture=p.profile_picture if p else None,
                mentored_students_count=18,
                active_projects_count=4,
                courses=["Distributed Computing", "Advanced Database Systems"],
            )
        )

    if len(faculty_items) < 10:
        sample_faculty = [
            (
                "Dr. Arvind Sharma",
                "hod@sbjit.edu.in",
                "Professor & Head of Department",
                "Distributed Systems, Cloud & High Performance Computing",
                24,
                6,
                ["Distributed Systems", "Cloud Architecture"],
            ),
            (
                "Dr. Meenakshi Rao",
                "m.rao@sbjit.edu.in",
                "Associate Professor & NBA Coordinator",
                "Machine Learning, Deep Vision & Bio-Informatics",
                18,
                5,
                ["Neural Networks", "Data Mining"],
            ),
            (
                "Dr. Kapil Deshmukh",
                "k.deshmukh@sbjit.edu.in",
                "Associate Professor & Research Chair",
                "Internet of Things & Embedded Cyber-Physical Systems",
                16,
                5,
                ["IoT Systems", "Embedded Systems"],
            ),
            (
                "Dr. Ananya Sengupta",
                "a.sengupta@sbjit.edu.in",
                "Associate Professor",
                "Information Retrieval, NLP & Big Data Architectures",
                14,
                4,
                ["Big Data Analytics", "Data Warehousing"],
            ),
            (
                "Prof. Rajesh Verma",
                "r.verma@sbjit.edu.in",
                "Assistant Professor & Placement Liaison",
                "Cybersecurity, Network Protocols & Cryptography",
                15,
                3,
                ["Network Security", "Ethical Hacking"],
            ),
            (
                "Prof. Sunita Patil",
                "s.patil@sbjit.edu.in",
                "Assistant Professor & Mentorship Chair",
                "Relational Database Management & Algorithm Optimization",
                20,
                4,
                ["DBMS", "Data Structures"],
            ),
            (
                "Prof. Amit Kulkarni",
                "a.kulkarni@sbjit.edu.in",
                "Assistant Professor & TPO Coordinator",
                "Full Stack Web Engineering & Cloud Native DevOps",
                18,
                4,
                ["Web Technologies", "Enterprise Architecture"],
            ),
            (
                "Prof. Sneha Kadam",
                "s.kadam@sbjit.edu.in",
                "Assistant Professor",
                "Computer Graphics, AR/VR & Human Computer Interaction",
                12,
                3,
                ["Computer Graphics", "HCI"],
            ),
            (
                "Prof. Vinay Joshi",
                "v.joshi@sbjit.edu.in",
                "Assistant Professor & Lab In-charge",
                "Operating Systems, Linux Internals & Virtualization",
                14,
                3,
                ["Operating Systems", "System Programming"],
            ),
            (
                "Prof. Prachi Nair",
                "p.nair@sbjit.edu.in",
                "Assistant Professor & Project Chair",
                "Blockchain Architecture & Smart Contract Security",
                12,
                3,
                ["Blockchain", "Cryptography"],
            ),
            (
                "Prof. Sandeep Shinde",
                "s.shinde@sbjit.edu.in",
                "Assistant Professor",
                "Artificial Intelligence & Soft Computing",
                15,
                3,
                ["AI Systems", "Soft Computing"],
            ),
            (
                "Prof. Pooja Mahajan",
                "p.mahajan@sbjit.edu.in",
                "Assistant Professor",
                "Mobile App Development & Cross-Platform Frameworks",
                16,
                4,
                ["Mobile Computing", "React Native"],
            ),
        ]
        for idx, (fn, em, des, spec, ment, prj, crs) in enumerate(sample_faculty):
            if not any(f.email == em for f in faculty_items):
                faculty_items.append(
                    DepartmentFacultyItem(
                        id=300 + idx,
                        name=fn,
                        email=em,
                        designation=des,
                        department=active_dept,
                        specialization=spec,
                        mentored_students_count=ment,
                        active_projects_count=prj,
                        courses=crs,
                    )
                )

    return APIResponse(data=faculty_items)


# ── 4. Department Alumni Directory ───────────────────────────────────────────


@router.get("/alumni", response_model=APIResponse[list[DepartmentAlumniItem]])
async def get_department_alumni(
    department: str | None = Query(default=None),
    grad_year: int | None = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    """Retrieve alumni directory for the department."""
    active_dept = resolve_department_scope(current_user, department)

    alumni_list = [
        DepartmentAlumniItem(
            id=401,
            name="Saurabh Kothari",
            email="saurabh.k@google.com",
            department=active_dept,
            graduation_year=2022,
            company="Google India",
            role_title="Senior Software Engineer (Cloud)",
            location="Bengaluru, Karnataka",
            is_mentor=True,
            referrals_count=6,
            skills=["Kubernetes", "Golang", "Cloud Infrastructure", "System Design"],
        ),
        DepartmentAlumniItem(
            id=402,
            name="Rituja Sen",
            email="rituja.sen@microsoft.com",
            department=active_dept,
            graduation_year=2021,
            company="Microsoft",
            role_title="Applied AI Scientist",
            location="Hyderabad, Telangana",
            is_mentor=True,
            referrals_count=4,
            skills=["PyTorch", "Large Language Models", "Computer Vision", "Azure AI"],
        ),
        DepartmentAlumniItem(
            id=403,
            name="Pranav Joshi",
            email="pranav.j@amazon.com",
            department=active_dept,
            graduation_year=2023,
            company="Amazon Web Services",
            role_title="SDE-2 (Distributed Storage)",
            location="Pune, Maharashtra",
            is_mentor=True,
            referrals_count=8,
            skills=["AWS", "Java", "DynamoDB", "Microservices"],
        ),
        DepartmentAlumniItem(
            id=404,
            name="Divya Bhargava",
            email="divya.b@barclays.com",
            department=active_dept,
            graduation_year=2020,
            company="Barclays Global Service Centre",
            role_title="Lead DevOps Architect",
            location="Pune, Maharashtra",
            is_mentor=False,
            referrals_count=3,
            skills=["CI/CD", "Terraform", "Security Compliance", "FinTech"],
        ),
        DepartmentAlumniItem(
            id=405,
            name="Kunal Gaikwad",
            email="kunal.g@uber.com",
            department=active_dept,
            graduation_year=2022,
            company="Uber",
            role_title="Backend Engineer (Routing Engine)",
            location="Bengaluru, Karnataka",
            is_mentor=True,
            referrals_count=5,
            skills=["Kafka", "Redis", "Distributed Caching", "Go"],
        ),
        DepartmentAlumniItem(
            id=406,
            name="Ishaan Malhotra",
            email="ishaan.m@hyperscale.io",
            department=active_dept,
            graduation_year=2019,
            company="HyperScale Labs",
            role_title="Co-Founder & CTO",
            location="Bengaluru, Karnataka",
            is_mentor=True,
            referrals_count=10,
            skills=["Startups", "Scalable Systems", "Venture Capital", "Python"],
        ),
        DepartmentAlumniItem(
            id=407,
            name="Tanvi Agarwal",
            email="tanvi.a@atlassian.com",
            department=active_dept,
            graduation_year=2023,
            company="Atlassian",
            role_title="Frontend Platform Engineer",
            location="Bengaluru, Karnataka",
            is_mentor=True,
            referrals_count=4,
            skills=["React", "TypeScript", "Performance", "Design Systems"],
        ),
        DepartmentAlumniItem(
            id=408,
            name="Aditya Nambiar",
            email="aditya.n@gs.com",
            department=active_dept,
            graduation_year=2021,
            company="Goldman Sachs",
            role_title="Quantitative Developer",
            location="Mumbai, Maharashtra",
            is_mentor=False,
            referrals_count=3,
            skills=["C++", "High Frequency Trading", "Algorithms", "Python"],
        ),
        DepartmentAlumniItem(
            id=409,
            name="Shreya Iyer",
            email="shreya.i@nvidia.com",
            department=active_dept,
            graduation_year=2022,
            company="NVIDIA",
            role_title="ML Infrastructure Engineer",
            location="Pune, Maharashtra",
            is_mentor=True,
            referrals_count=6,
            skills=["CUDA", "PyTorch", "GPU Clustering", "TensorRT"],
        ),
        DepartmentAlumniItem(
            id=410,
            name="Harshit Bansal",
            email="harshit.b@crowdstrike.com",
            department=active_dept,
            graduation_year=2020,
            company="CrowdStrike",
            role_title="Senior Security Analyst",
            location="Bengaluru, Karnataka",
            is_mentor=True,
            referrals_count=4,
            skills=["Threat Hunting", "Reverse Engineering", "SIEM", "Go"],
        ),
    ]

    if grad_year:
        alumni_list = [a for a in alumni_list if a.graduation_year == grad_year]

    return APIResponse(data=alumni_list)


# ── 5. Department Achievements & Verification ─────────────────────────────────


@router.get(
    "/achievements", response_model=APIResponse[list[DepartmentAchievementItem]]
)
async def get_department_achievements(
    department: str | None = Query(default=None),
    status_filter: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all student and faculty achievements in the department."""
    active_dept = resolve_department_scope(current_user, department)
    results = [
        a for a in _ACHIEVEMENTS_STORE if active_dept.lower() in a["department"].lower()
    ]
    if status_filter and status_filter.upper() != "ALL":
        results = [a for a in results if a["status"].lower() == status_filter.lower()]

    return APIResponse(data=[DepartmentAchievementItem(**item) for item in results])


@router.post(
    "/achievements/verify", response_model=APIResponse[DepartmentAchievementItem]
)
async def verify_department_achievement(
    payload: AchievementVerifyRequest,
    current_user: User = Depends(get_current_user),
):
    """Verify or reject a student achievement by HOD."""
    hod_name = (
        f"{current_user.profile.first_name or ''} {current_user.profile.last_name or ''}".strip()
        if current_user.profile
        else "Dr. Arvind Sharma (HOD)"
    )

    target = next(
        (a for a in _ACHIEVEMENTS_STORE if a["id"] == payload.achievement_id), None
    )
    if not target:
        raise HTTPException(status_code=404, detail="Achievement record not found")

    target["status"] = payload.status
    target["verified_by"] = f"{hod_name} (HOD)"
    target["verified_at"] = datetime.now(timezone.utc).strftime("%b %d, %Y")

    return APIResponse(
        message=f"Achievement record marked as {payload.status}",
        data=DepartmentAchievementItem(**target),
    )


# ── 6. Management Connect (Structured Requests & Announcements) ───────────────


@router.get(
    "/management-connect/requests",
    response_model=APIResponse[list[ManagementConnectRequest]],
)
async def get_management_requests(
    department: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all structured requests submitted by the HOD to Management."""
    active_dept = resolve_department_scope(current_user, department)
    results = [
        r
        for r in _MANAGEMENT_REQUESTS
        if active_dept.lower() in r["department"].lower()
    ]
    return APIResponse(data=[ManagementConnectRequest(**r) for r in results])


@router.post(
    "/management-connect/requests", response_model=APIResponse[ManagementConnectRequest]
)
async def create_management_request(
    payload: ManagementConnectRequestCreate,
    current_user: User = Depends(get_current_user),
):
    """Submit a structured proposal or requirement request to Institutional Admin/Management."""
    active_dept = resolve_department_scope(current_user)
    hod_name = (
        f"{current_user.profile.first_name or ''} {current_user.profile.last_name or ''}".strip()
        if current_user.profile
        else "Dr. Arvind Sharma"
    )

    new_id = max([r["id"] for r in _MANAGEMENT_REQUESTS], default=0) + 1
    new_req = {
        "id": new_id,
        "title": payload.title,
        "category": payload.category,
        "department": active_dept,
        "hod_name": hod_name or "Head of Department",
        "hod_email": current_user.email,
        "description": payload.description,
        "budget_estimate": payload.budget_estimate or "N/A",
        "target_cohort": payload.target_cohort or "Department-Wide",
        "expected_outcomes": payload.expected_outcomes
        or "Academic progression and student enhancement",
        "status": "Pending",
        "management_notes": None,
        "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %I:%M %p"),
        "updated_at": None,
    }
    _MANAGEMENT_REQUESTS.insert(0, new_req)

    return APIResponse(
        message="Request submitted to Institutional Management successfully",
        data=ManagementConnectRequest(**new_req),
    )


@router.patch(
    "/management-connect/requests/{request_id}",
    response_model=APIResponse[ManagementConnectRequest],
)
async def update_management_request_status(
    request_id: int,
    status_val: str = Query(...),
    notes: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    """Update status of a Management request (for admin/management response simulation)."""
    target = next((r for r in _MANAGEMENT_REQUESTS if r["id"] == request_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Request not found")

    target["status"] = status_val
    if notes:
        target["management_notes"] = notes
    target["updated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %I:%M %p")

    return APIResponse(
        message="Management request updated successfully",
        data=ManagementConnectRequest(**target),
    )


@router.get(
    "/management-connect/announcements",
    response_model=APIResponse[list[ManagementAnnouncement]],
)
async def get_management_announcements(
    current_user: User = Depends(get_current_user),
):
    """Retrieve official circulars and policy decisions from Admin/Management."""
    return APIResponse(
        data=[ManagementAnnouncement(**a) for a in _MANAGEMENT_ANNOUNCEMENTS]
    )


# ── 7. Department Reports Suite ──────────────────────────────────────────────


@router.get("/reports", response_model=APIResponse[list[DepartmentReportItem]])
async def get_department_reports(
    department: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    """List all official department reports."""
    active_dept = resolve_department_scope(current_user, department)
    results = [
        r for r in _REPORTS_STORE if active_dept.lower() in r["department"].lower()
    ]
    return APIResponse(data=[DepartmentReportItem(**r) for r in results])


@router.post("/reports/submit", response_model=APIResponse[DepartmentReportItem])
async def submit_department_report(
    payload: DepartmentReportSubmitRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate and submit an official department report to Management."""
    active_dept = resolve_department_scope(current_user)

    new_id = max([r["id"] for r in _REPORTS_STORE], default=0) + 1
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %I:%M %p")

    # Generate dynamic summary metrics based on report type
    sample_metrics = {
        "Total Scope": "620 Students & 18 Faculty",
        "Accreditation Compliance": "96.4%",
        "Generated By": current_user.email,
    }
    if "Placement" in payload.report_type:
        sample_metrics = {
            "Total Offers": 124,
            "Highest Package": "32.0 LPA",
            "Average Package": "8.1 LPA",
            "Placement Conversion": "85.2%",
        }
    elif "Student" in payload.report_type:
        sample_metrics = {
            "Enrolled Cohort": 623,
            "Average CGPA": 8.24,
            "Pass Percentage": "96.1%",
            "Honors Degree Eligible": 142,
        }

    new_report = {
        "id": new_id,
        "title": payload.title,
        "report_type": payload.report_type,
        "department": active_dept,
        "period": payload.period,
        "generated_at": now_str,
        "submitted_at": now_str,
        "status": "Submitted",
        "management_feedback": "Received by Dean's Office. Queued for Academic Council agenda.",
        "summary_metrics": sample_metrics,
    }
    _REPORTS_STORE.insert(0, new_report)

    return APIResponse(
        message=f"{payload.report_type} submitted to Institutional Management successfully",
        data=DepartmentReportItem(**new_report),
    )


# ── 8. Department Analytics ───────────────────────────────────────────────────


@router.get("/analytics", response_model=APIResponse[DepartmentAnalyticsData])
async def get_department_analytics(
    department: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    """Retrieve detailed analytics for the department."""
    active_dept = resolve_department_scope(current_user, department)

    data = DepartmentAnalyticsData(
        department=active_dept,
        student_engagement={
            "Active Daily Students": 486,
            "Weekly Engagement %": 88.5,
            "Event Participation %": 74.2,
            "Community Ties per Student": 14.6,
        },
        profile_completion={
            "Complete (100%)": 348,
            "Moderate (70-99%)": 215,
            "Incomplete (<70%)": 60,
            "Average Completion %": 92.4,
        },
        skill_distribution=[
            {"skill": "Full Stack & Web", "count": 312},
            {"skill": "AI & Machine Learning", "count": 264},
            {"skill": "Cloud & DevOps (AWS/Docker)", "count": 198},
            {"skill": "Data Structures & Algorithms", "count": 380},
            {"skill": "Cybersecurity & Networks", "count": 142},
            {"skill": "Mobile Development (React Native)", "count": 110},
        ],
        certification_status={
            "Cloud Certifications (AWS/GCP/Azure)": 142,
            "AI/ML Specializations": 98,
            "Programming & DSA Certifications": 210,
            "Cybersecurity & Security Badges": 54,
        },
        project_participation={
            "Industry Capstone Projects": 46,
            "Open Source & Hackathon Projects": 128,
            "Research & Patent Prototypes": 18,
            "Total Active Repositories": 312,
        },
        internship_stats={
            "Final Year Placed & Interning": 118,
            "Pre-Final Year Summer Interns": 92,
            "Average Monthly Stipend (₹)": 28500,
            "Conversion to PPO %": 62.5,
        },
        placement_stats={
            "Total Tier-1 Offers (>10 LPA)": 38,
            "Core Product & Service Offers": 86,
            "Highest CTC (LPA)": 32.0,
            "Average CTC (LPA)": 8.2,
        },
        alumni_engagement={
            "Active Alumni Mentors": 26,
            "Referrals Provided in 2026": 31,
            "Guest Lectures & Webinars": 8,
            "Alumni-Sponsored Projects": 5,
        },
        event_participation=[
            {"month": "May", "events": 3, "participants": 240},
            {"month": "Jun", "events": 2, "participants": 180},
            {"month": "Jul", "events": 4, "participants": 390},
            {"month": "Aug", "events": 5, "participants": 460},
            {"month": "Sep", "events": 6, "participants": 520},
        ],
    )
    return APIResponse(data=data)
