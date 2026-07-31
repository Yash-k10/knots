from datetime import datetime

from pydantic import BaseModel


class ConnectionRequest(BaseModel):
    addressee_id: int


class ConnectionUpdate(BaseModel):
    status: str  # ACCEPTED, REJECTED


class ConnectionResponse(BaseModel):
    id: int
    requester_id: int
    addressee_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class MutualConnectionsResponse(BaseModel):
    target_user_id: int
    mutual_count: int
    mutual_user_ids: list[int]


class ConnectionSuggestionResponse(BaseModel):
    user_id: int
    email: str
    mutual_count: int
    recommendation_reason: str
    score: int
