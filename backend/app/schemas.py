from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from app.models import MediaType


class MediaEntryBase(BaseModel):
    """Base schema for media entries, shared by input and output models."""
    title: str
    media_type: MediaType
    external_id: str
    poster_path: Optional[str] = None

class MediaEntryCreate(MediaEntryBase):
    """Schema for creating a new media entry (used in POST requests)."""
    pass

class MediaEntryResponse(MediaEntryBase):
    """Schema for the response of the API (used in GET requests)."""
    id: int
    watched_at: datetime

    # Configuration to allow Pydantic to read data directly from SQLAlchemy models
    model_config = ConfigDict(from_attributes=True)