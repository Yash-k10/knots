from pydantic import BaseModel


class BatchStat(BaseModel):
    batch: str
    graduation_year: int | None = None
    total: int
    placed_or_interned: int
    avg_cgpa: float


class DepartmentStatsResponse(BaseModel):
    department: str
    total_students: int
    total_faculty: int
    placed_or_interned_count: int
    placement_rate: float
    average_cgpa: float
    clubs_count: int
    events_count: int
    batches: list[BatchStat]


class DepartmentStudentItem(BaseModel):
    id: int
    first_name: str | None = None
    last_name: str | None = None
    email: str
    department: str | None = None
    graduation_year: int | None = None
    profile_picture: str | None = None
    tenth_percentage: float | None = None
    twelfth_diploma_percentage: float | None = None
    skills: list[str] | None = None
    projects_count: int = 0
    certifications_count: int = 0
    cgpa: float | None = None
    status: str = "Seeking Internship"


class DepartmentFacultyItem(BaseModel):
    id: int
    name: str
    email: str
    designation: str
    department: str
    specialization: str | None = None
    profile_picture: str | None = None
