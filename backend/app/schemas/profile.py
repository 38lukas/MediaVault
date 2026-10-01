"""Pydantic request/response schemas for profile stats."""

from pydantic import BaseModel, Field

from app.schemas.media import MediaEntryResponse

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


class ProfileStatsResponse(BaseModel):
    """Aggregated profile stats derived from the user's media_entries."""

    finished: FinishedCounts
    rating_distribution: list[RatingBucket]
    recently_finished: list[MediaEntryResponse]
