"""Pydantic request/response schemas for media entries and auth."""

from pydantic import BaseModel, ConfigDict, model_validator
from datetime import datetime
from typing import Optional
from app.enums import MediaType, MediaStatus, ALLOWED_STATUSES


class LoginRequest(BaseModel):
    """Credentials submitted on the login form."""

    username: str
    password: str


class UserResponse(BaseModel):
    """Public user payload returned after a successful login."""

    username: str
    joined_date: datetime

    model_config = ConfigDict(from_attributes=True)


class MediaEntryBase(BaseModel):
    """Base schema for media entries, shared by input and output models."""
    title: str
    media_type: MediaType
    status: MediaStatus
    external_id: str
    poster_path: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    @model_validator(mode='after')
    def validate_status_for_media_type(self):
        """Validate that the status is allowed for the given media type."""
        allowed = ALLOWED_STATUSES.get(self.media_type, set())
        if self.status not in allowed:
            allowed_names = ", ".join([s.value for s in allowed])
            raise ValueError(
                f"The status '{self.status.value}' is not allowed for the type '{self.media_type.value}'. "
                f"Allowed statuses: {allowed_names}"
            )
        return self

class MediaEntryCreate(MediaEntryBase):
    """Schema for creating a new media entry (used in POST requests)."""
    pass

class MediaEntryResponse(MediaEntryBase):
    """Schema for the response of the API (used in GET requests)."""
    id: int
    username: str

    # Configuration to allow Pydantic to read data directly from SQLAlchemy models
    model_config = ConfigDict(from_attributes=True)
