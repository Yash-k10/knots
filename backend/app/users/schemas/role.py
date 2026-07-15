from pydantic import BaseModel
from typing import List, Optional


class RoleBase(BaseModel):
    name: str
    permissions: Optional[List[str]] = None


class RoleResponse(RoleBase):
    id: int

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role_id: int
