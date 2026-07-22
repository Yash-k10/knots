from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CompanyBase(BaseModel):
    name: str = Field(..., max_length=200, description="Company name")
    logo_url: Optional[str] = Field(None, max_length=500, description="Logo image URL")
    website: Optional[str] = Field(
        None, max_length=255, description="Company website URL"
    )
    industry: Optional[str] = Field(None, max_length=100, description="Industry sector")
    description: Optional[str] = Field(None, description="Company description")
    location: Optional[str] = Field(
        None, max_length=255, description="Headquarters/office location"
    )


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    logo_url: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)


class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
