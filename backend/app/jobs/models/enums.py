import enum


class JobTypeEnum(str, enum.Enum):
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    INTERNSHIP = "internship"
    CONTRACT = "contract"


class WorkplaceTypeEnum(str, enum.Enum):
    REMOTE = "remote"
    ON_SITE = "on-site"
    HYBRID = "hybrid"


class JobStatusEnum(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"


class ApplicationStatusEnum(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"
    ACCEPTED = "accepted"
