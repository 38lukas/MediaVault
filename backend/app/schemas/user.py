"""Pydantic request/response schemas for auth and user settings."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

# Must match the frontend SortField / CardSize / TypeFilter unions.
SortField = Literal[
    "title", "status", "rating", "started_at", "finished_at", "months", "year", "last_played"
]
CardSize = Literal[0, 1, 2, 3, 4]
TypeFilter = Literal["All", "Game/DLC", "Movie", "Series", "Anime", "Book"]
# Profile page elements that can be hidden (must match frontend PROFILE_SECTIONS).
ProfileSection = Literal[
    "avatar", "rating", "achievements", "finished_all_time", "finished_year", "favorites", "recent_activity"
]
# Unified status labels the library groups by (must match frontend UNIFIED_STATUS_FILTERS).
UnifiedStatus = Literal["Active", "Finished", "Played", "Shelved", "Dropped", "Queue", "Wishlist"]


class LoginRequest(BaseModel):
    """Credentials submitted on the login form."""

    username: str
    password: str


class RegisterRequest(LoginRequest):
    """Username and password for a new account."""


class UserResponse(BaseModel):
    """Public user payload returned after a successful login."""

    username: str
    joined_date: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(UserResponse):
    """Login / sign-up result: the user plus a bearer token for later requests."""

    access_token: str
    token_type: Literal["bearer"] = "bearer"


class UserSettingsResponse(BaseModel):
    """Account info plus general settings of the current user."""

    username: str
    joined_date: datetime
    default_sort_field: SortField
    default_card_size: CardSize
    default_type_filter: TypeFilter
    avatar_path: Optional[str] = None
    library_loaded_statuses: Optional[list[UnifiedStatus]] = None  # None = all expanded.
    profile_hidden_sections: Optional[list[ProfileSection]] = None  # None = nothing hidden.

    model_config = ConfigDict(from_attributes=True)


class AccountUpdateResponse(UserSettingsResponse):
    """Settings after an account change, plus a fresh token (rename and password
    changes invalidate the old one)."""

    access_token: str
    token_type: Literal["bearer"] = "bearer"


class UserSettingsUpdate(BaseModel):
    """Partial update of the general settings; omitted fields stay unchanged."""

    default_sort_field: Optional[SortField] = None
    default_card_size: Optional[CardSize] = None
    default_type_filter: Optional[TypeFilter] = None
    library_loaded_statuses: Optional[list[UnifiedStatus]] = None  # [] = all collapsed.
    profile_hidden_sections: Optional[list[ProfileSection]] = None  # [] = nothing hidden.


class UserAccountUpdate(BaseModel):
    """Username and/or password change. Password changes require current_password."""

    current_password: Optional[str] = None
    new_username: Optional[str] = Field(default=None, min_length=1)
    new_password: Optional[str] = Field(default=None, min_length=1)
