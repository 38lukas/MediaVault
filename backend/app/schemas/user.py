"""Pydantic request/response schemas for auth and user settings."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

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
    default_sort_field: SortField

    model_config = ConfigDict(from_attributes=True)


class UserSettingsUpdate(BaseModel):
    """Partial update of the general settings; omitted fields stay unchanged."""

    default_sort_field: Optional[SortField] = None


class UserAccountUpdate(BaseModel):
    """Username and/or password change. Password changes require current_password."""

    current_password: Optional[str] = None
    new_username: Optional[str] = Field(default=None, min_length=1)
    new_password: Optional[str] = Field(default=None, min_length=1)
