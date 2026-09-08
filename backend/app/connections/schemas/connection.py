from datetime import datetime

from pydantic import BaseModel


class ConnectionRequest(BaseModel):
    addressee_id: int


class ConnectionUpdate(BaseModel):
    status: str  # ACCEPTED, REJECTED


class ConnectionUserProfileSummary(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    profile_picture: str | None = None
    department: str | None = None

    class Config:
        from_attributes = True


class ConnectionUserSummary(BaseModel):
    id: int
    email: str
    profile: ConnectionUserProfileSummary | None = None

    class Config:
        from_attributes = True


class ConnectionResponse(BaseModel):
    id: int
    requester_id: int
    addressee_id: int
    status: str
    created_at: datetime
    requester: ConnectionUserSummary | None = None
    addressee: ConnectionUserSummary | None = None

    class Config:
        from_attributes = True


class MutualConnectionsResponse(BaseModel):
    target_user_id: int
    mutual_count: int
    mutual_user_ids: list[int]


class ConnectionSuggestionResponse(BaseModel):
    user_id: int
    email: str
    first_name: str | None = None
    last_name: str | None = None
    profile_picture: str | None = None
    department: str | None = None
    mutual_count: int = 0
    recommendation_reason: str = "Suggested connection"
    score: int = 10
    profile: ConnectionUserProfileSummary | None = None

    class Config:
        from_attributes = True
