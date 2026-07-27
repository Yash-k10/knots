from pydantic import BaseModel


class RoleBase(BaseModel):
    name: str
    permissions: list[str] | None = None


class RoleResponse(RoleBase):
    id: int

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role_id: int
