from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CompanyBase(BaseModel):
    name: str = Field(..., max_length=200, description="Company name")
    logo_url: str | None = Field(None, max_length=500, description="Logo image URL")
    website: str | None = Field(None, max_length=255, description="Company website URL")
    industry: str | None = Field(None, max_length=100, description="Industry sector")
    description: str | None = Field(None, description="Company description")
    location: str | None = Field(
        None, max_length=255, description="Headquarters/office location"
    )


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = Field(None, max_length=200)
    logo_url: str | None = Field(None, max_length=500)
    website: str | None = Field(None, max_length=255)
    industry: str | None = Field(None, max_length=100)
    description: str | None = None
    location: str | None = Field(None, max_length=255)


class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
