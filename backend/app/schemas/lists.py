"""Pydantic request/response schemas for media lists."""

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.media import MediaEntryResponse


class MediaListWrite(BaseModel):
    """Name and description for creating or updating a list."""

    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("description", mode="before")
    @classmethod
    def strip_description(cls, value: object) -> object:
        if isinstance(value, str):
            text = value.strip()
            return text or None
        return value


class MediaListItemCreate(BaseModel):
    """Library entry to append to a list."""

    entry_id: int


class MediaListReorder(BaseModel):
    """Full item order for a list, first to last."""

    item_ids: list[int]


class MediaListItemResponse(BaseModel):
    """One ordered slot in a list, with the library entry it points at."""

    id: int
    position: int
    entry: MediaEntryResponse

    model_config = ConfigDict(from_attributes=True)


class MediaListResponse(BaseModel):
    """A user's list and its entries in display order."""

    id: int
    username: str
    name: str
    description: Optional[str] = None
    items: list[MediaListItemResponse]

    model_config = ConfigDict(from_attributes=True)
