"""Pydantic request/response schemas for media entries and auth."""

from pydantic import BaseModel, ConfigDict, Field, model_validator
from datetime import datetime
from typing import Literal, Optional
from app.enums import MediaType, MediaStatus, ALLOWED_STATUSES

# Must match the frontend SortField union.
SortField = Literal["title", "status", "rating", "started_at", "finished_at", "months"]


class LoginRequest(BaseModel):
    """Credentials submitted on the login form."""

    username: str
    password: str


class UserResponse(BaseModel):
    """Public user payload returned after a successful login."""

    username: str
    joined_date: datetime

    model_config = ConfigDict(from_attributes=True)


class UserSettingsResponse(BaseModel):
    """Account info plus general settings of the current user."""

    username: str
    joined_date: datetime
    ratings_enabled: bool
    default_sort_field: SortField

    model_config = ConfigDict(from_attributes=True)


class UserSettingsUpdate(BaseModel):
    """Partial update of the general settings; omitted fields stay unchanged."""

    ratings_enabled: Optional[bool] = None
    default_sort_field: Optional[SortField] = None


class UserAccountUpdate(BaseModel):
    """Username and/or password change. Password changes require current_password."""

    current_password: Optional[str] = None
    new_username: Optional[str] = Field(default=None, min_length=1)
    new_password: Optional[str] = Field(default=None, min_length=1)


class MediaEntryBase(BaseModel):
    """Base schema for media entries, shared by input and output models."""
    title: str
    media_type: MediaType
    status: MediaStatus
    playtime: Optional[int] = None
    external_id: str
    poster_path: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    rating: Optional[int] = Field(default=None, ge=1, le=10) # Null = unrated; when set, must be an integer 1–10.

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
        if self.playtime is not None and self.media_type not in {MediaType.GAME, MediaType.DLC}:
            raise ValueError(f"Playtime is only allowed for games and DLCs, but the current media type is '{self.media_type.value}'.")
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
