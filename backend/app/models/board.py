from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class BoardBase(BaseModel):
    neighborhood: str = Field(..., description="Neighborhood identifier")
    slug: str = Field(..., description="URL-friendly slug")
    display_name: str = Field(..., description="Display name for the board")
    description: Optional[str] = None
    grid_cols: int = Field(default=3, ge=1, le=6, description="Number of grid columns")
    metadata: Optional[dict] = Field(default_factory=dict, description="Flexible metadata")


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

