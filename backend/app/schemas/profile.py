"""Pydantic request/response schemas for profile stats."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.enums import MediaType
from app.schemas.media import MediaEntryResponse

FavoriteCategory = Literal["All", "Game", "Movie", "Series", "Anime", "Book"]

AchievementRarity = Literal["Bronze", "Silver", "Gold", "Platinum"]

class FinishedCounts(BaseModel):
    """All-time finished counts: total plus one count per media type."""

    total: int
    game: int
    dlc: int
    movie: int
    series: int
    anime: int
    book: int


class RatingBucket(BaseModel):
    """Histogram bucket for a single rating value (1–10)."""

    rating: int = Field(ge=1, le=10)
    count: int


class Achievement(BaseModel):
    """A profile achievement. image is an optional custom icon URL."""

    id: str
    title: str
    description: str
    unlocked: bool
    rarity: AchievementRarity
    image: str | None = None


class FavoriteSlot(BaseModel):
    """One favorite slot. title is null when the slot is empty."""

    slot: int = Field(ge=0, le=4)
    title: str | None = None
    media_type: str | None = None
    external_id: str | None = None
    poster_path: str | None = None
    is_number_one: bool = False


class FavoriteGroup(BaseModel):
    """Five favorite slots for one list: every media type, or a single type."""

    category: FavoriteCategory
    slots: list[FavoriteSlot]


class FavoriteSlotUpdate(BaseModel):
    """Replace or clear one slot in a favorites list. A null title clears the slot."""

    category: FavoriteCategory
    title: str | None = None
    media_type: MediaType | None = None
    external_id: str | None = None
    poster_path: str | None = None
    is_number_one: bool = False

    @model_validator(mode="after")
    def normalize_pick(self):
        self.title = self.title.strip() if self.title else None
        self.external_id = self.external_id.strip() if self.external_id else None
        if self.poster_path is not None:
            self.poster_path = self.poster_path.strip() or None

        if self.title is None and self.media_type is None and self.external_id is None:
            return self

        if not self.title or self.media_type is None or not self.external_id:
            raise ValueError("title, media_type, and external_id are required")
        if self.category == "All":
            return self
        if self.category == "Game":
            if self.media_type not in {MediaType.GAME, MediaType.DLC}:
                raise ValueError("That title does not match this favorites list")
            return self
        if self.media_type.value != self.category:
            raise ValueError("That title does not match this favorites list")
        return self


class ProfileStatsResponse(BaseModel):
    """Aggregated profile stats derived from the user's media_entries."""

    finished: FinishedCounts
    rating_distribution: list[RatingBucket]
    unrated_count: int
    recent_activity: list[MediaEntryResponse]
    achievements: list[Achievement]
    favorites: list[FavoriteGroup]
