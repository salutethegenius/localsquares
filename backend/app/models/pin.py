from pydantic import BaseModel, Field, HttpUrl, field_validator, model_validator
from typing import Optional
from datetime import datetime
from uuid import UUID

# Max sizes for metadata (security: prevent oversized payloads)
METADATA_STR_VALUE_MAX = 500
METADATA_TAGS_MAX_ITEMS = 20
METADATA_TAG_MAX_LEN = 50
METADATA_WEBSITE_MAX_LEN = 2048


class PinMetadata(BaseModel):
    """Flexible metadata structure for pins. All values size-limited."""
    hours: Optional[dict[str, str]] = None  # {"monday": "9am-5pm", ...}
    contact: Optional[dict[str, str]] = None  # {"phone": "+1242...", "whatsapp": "...", "email": "..."}
    location: Optional[dict] = None  # {"address": "...", "lat": 0.0, "lng": 0.0}
    tags: Optional[list[str]] = Field(None, max_length=METADATA_TAGS_MAX_ITEMS)
    website: Optional[str] = Field(None, max_length=METADATA_WEBSITE_MAX_LEN)

    @field_validator("tags")
    @classmethod
    def tags_item_length(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v
        for i, tag in enumerate(v):
            if not isinstance(tag, str) or len(tag) > METADATA_TAG_MAX_LEN:
                raise ValueError(f"Tag at index {i} must be a string of at most {METADATA_TAG_MAX_LEN} characters")
        return v

    @field_validator("website")
    @classmethod
    def website_format(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        v = v.strip()
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("Website must be a valid HTTP or HTTPS URL")
        return v

    @model_validator(mode="after")
    def limit_dict_value_lengths(self):
        """Ensure contact and hours dict values do not exceed max length."""
        for d in (self.contact, self.hours):
            if d:
                for k, val in d.items():
                    if isinstance(val, str) and len(val) > METADATA_STR_VALUE_MAX:
                        raise ValueError(f"Value for '{k}' exceeds maximum length of {METADATA_STR_VALUE_MAX}")
        if self.location and isinstance(self.location.get("address"), str):
            if len(self.location["address"]) > METADATA_STR_VALUE_MAX:
                raise ValueError(f"Address exceeds maximum length of {METADATA_STR_VALUE_MAX}")
        return self


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

