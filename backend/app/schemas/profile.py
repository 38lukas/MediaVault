"""Pydantic request/response schemas for profile stats."""

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.media import MediaEntryResponse

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


class ProfileStatsResponse(BaseModel):
    """Aggregated profile stats derived from the user's media_entries."""

    finished: FinishedCounts
    rating_distribution: list[RatingBucket]
    unrated_count: int
    recent_activity: list[MediaEntryResponse]
    achievements: list[Achievement]
