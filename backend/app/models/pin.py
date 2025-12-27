from pydantic import BaseModel, Field, HttpUrl
from typing import Optional
from datetime import datetime
from uuid import UUID


class PinMetadata(BaseModel):
    """Flexible metadata structure for pins."""
    hours: Optional[dict[str, str]] = None  # {"monday": "9am-5pm", ...}
    contact: Optional[dict[str, str]] = None  # {"phone": "+1242...", "whatsapp": "...", "email": "..."}
    location: Optional[dict] = None  # {"address": "...", "lat": 0.0, "lng": 0.0}
    tags: Optional[list[str]] = None
    website: Optional[str] = None


class PinBase(BaseModel):
    board_id: UUID = Field(..., description="Board this pin belongs to")
    title: str = Field(..., min_length=1, max_length=100, description="Pin title")
    caption: Optional[str] = Field(None, max_length=200, description="Short, bold caption")
    image_url: str = Field(..., description="URL to pin image")
    thumbnail_url: Optional[str] = None
    metadata: Optional[PinMetadata] = Field(default_factory=PinMetadata)
    featured: bool = Field(default=False, description="Whether pin is featured")


class PinCreate(PinBase):
    pass


class PinUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    caption: Optional[str] = Field(None, max_length=200)
    image_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    metadata: Optional[PinMetadata] = None
    status: Optional[str] = Field(None, pattern="^(draft|active|paused|archived|reported)$")
    featured: Optional[bool] = None


class Pin(PinBase):
    id: UUID
    user_id: UUID
    status: str = Field(default="active", description="Pin status")
    view_count: int = Field(default=0, description="Total view count")
    click_count: int = Field(default=0, description="Total click count")
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PinWithSlot(Pin):
    """Pin with slot position information."""
    slot_row: Optional[int] = None
    slot_col: Optional[int] = None

