from pydantic import BaseModel


class BatchStat(BaseModel):
    batch: str
    graduation_year: int | None = None
    total: int
    placed_or_interned: int
    avg_cgpa: float
    placed_count: int = 0
    seeking_count: int = 0


class CohortBreakdown(BaseModel):
    first_year: int = 0
    second_year: int = 0
    third_year: int = 0
    fourth_year: int = 0


class DepartmentStatsResponse(BaseModel):
    department: str
    total_students: int
    total_faculty: int
    active_faculty: int = 0
    placed_or_interned_count: int
    placed_count: int = 0
    seeking_placement_count: int = 0
    internships_count: int = 0
    placement_rate: float
    average_cgpa: float
    clubs_count: int
    events_count: int
    alumni_engaged_count: int = 0
    alumni_mentors_count: int = 0
    active_referrals_count: int = 0
    student_engagement_rate: float = 88.5
    profile_completion_rate: float = 91.2
    pending_actions_count: int = 4
    reports_submitted_count: int = 6
    reports_pending_count: int = 2
    management_updates_count: int = 5
    cohorts: CohortBreakdown | None = None
    batches: list[BatchStat]


class DepartmentStudentItem(BaseModel):
    id: int
    first_name: str | None = None
    last_name: str | None = None
    email: str
    department: str | None = None
    graduation_year: int | None = None
    academic_year: str = "Third Year"
    section: str = "A"
    profile_picture: str | None = None
    tenth_percentage: float | None = None
    twelfth_diploma_percentage: float | None = None
    skills: list[str] | None = None
    projects_count: int = 0
    certifications_count: int = 0
    achievements_count: int = 0
    cgpa: float | None = None
    status: str = "Seeking Internship"
    profile_completion_pct: int = 85
    is_verified: bool = True


class DepartmentFacultyItem(BaseModel):
    id: int
    name: str
    email: str
    designation: str
    department: str
    specialization: str | None = None
    profile_picture: str | None = None
    mentored_students_count: int = 12
    active_projects_count: int = 3
    courses: list[str] = ["Advanced Algorithms", "Department Lab"]


class DepartmentAlumniItem(BaseModel):
    id: int
    name: str
    email: str
    department: str
    graduation_year: int
    company: str
    role_title: str
    location: str = "Nagpur / Pune"
    is_mentor: bool = True
    referrals_count: int = 2
    skills: list[str] = ["Distributed Systems", "Cloud Computing"]
    profile_picture: str | None = None


class DepartmentAchievementItem(BaseModel):
    id: int
    student_id: int
    student_name: str
    student_email: str
    department: str
    batch: str
    title: str
    category: str
    details: str
    date: str
    proof_url: str | None = None
    status: str = "Pending Verification"
    verified_by: str | None = None
    verified_at: str | None = None


class AchievementVerifyRequest(BaseModel):
    achievement_id: int
    status: str
    remarks: str | None = None


class ManagementConnectRequest(BaseModel):
    id: int
    title: str
    category: str
    department: str
    hod_name: str
    hod_email: str
    description: str
    budget_estimate: str | None = None
    target_cohort: str | None = None
    expected_outcomes: str | None = None
    status: str = "Pending"
    management_notes: str | None = None
    created_at: str
    updated_at: str | None = None


class ManagementConnectRequestCreate(BaseModel):
    title: str
    category: str
    description: str
    budget_estimate: str | None = None
    target_cohort: str | None = None
    expected_outcomes: str | None = None


class ManagementAnnouncement(BaseModel):
    id: int
    title: str
    category: str
    priority: str = "Standard"
    sender: str
    content: str
    date: str
    attachment_url: str | None = None
    is_read: bool = False


class DepartmentReportItem(BaseModel):
    id: int
    title: str
    report_type: str
    department: str
    period: str
    generated_at: str
    submitted_at: str | None = None
    status: str = "Draft"
    management_feedback: str | None = None
    summary_metrics: dict[str, str | int | float] = {}


class DepartmentReportSubmitRequest(BaseModel):
    report_type: str
    period: str
    title: str
    notes: str | None = None


class DepartmentAnalyticsData(BaseModel):
    department: str
    student_engagement: dict[str, int | float]
    profile_completion: dict[str, int | float]
    skill_distribution: list[dict[str, str | int]]
    certification_status: dict[str, int]
    project_participation: dict[str, int]
    internship_stats: dict[str, int | float]
    placement_stats: dict[str, int | float]
    alumni_engagement: dict[str, int]
    event_participation: list[dict[str, str | int]]
