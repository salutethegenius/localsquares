from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.core.sanitize import sanitize_string, sanitize_html


class BoardBase(BaseModel):
    neighborhood: str = Field(..., description="Neighborhood identifier")
    slug: str = Field(..., description="URL-friendly slug")
    display_name: str = Field(..., description="Display name for the board")
    description: Optional[str] = None
    grid_cols: int = Field(default=3, ge=1, le=6, description="Number of grid columns")
    metadata: Optional[dict] = Field(default_factory=dict, description="Flexible metadata")

    @field_validator("neighborhood", "slug", "display_name")
    @classmethod
    def sanitize_text_fields(cls, v: str) -> str:
        cleaned = sanitize_html(v, max_length=100)
        if not cleaned:
            raise ValueError("Field cannot be empty")
        return cleaned

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v, max_length=500)


class BoardCreate(BoardBase):
    pass


class BoardUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    grid_cols: Optional[int] = Field(None, ge=1, le=6)
    metadata: Optional[dict] = None


class Board(BoardBase):
    id: UUID
    grid_rows: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

