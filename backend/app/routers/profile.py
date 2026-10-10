"""Profile stats routes under /api/profile."""

from collections import Counter
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_username
from app.enums import MediaStatus, MediaType
from app import models, schemas

router = APIRouter(prefix="/profile", tags=["profile"])

# Statuses that count as "finished" for all-time totals.
_FINISHED_STATUSES = {
    MediaStatus.FINISHED.value,
    MediaStatus.PLAYED.value,
    MediaStatus.WATCHED.value,
    MediaStatus.READ.value,
}


@router.get("/stats", response_model=schemas.ProfileStatsResponse)
def get_profile_stats(
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Aggregate finished counts, rating histogram, and recently active entries."""

    # get all entries for the current user
    entries = (
        db.query(models.MediaEntry)
        .filter(models.MediaEntry.username == username)
        .all()
    )

    # count the number of finished entries for each media type
    type_counts = Counter(
        entry.media_type
        for entry in entries
        if entry.status in _FINISHED_STATUSES
    )

    # create a new FinishedCounts object with the counts for each media type
    finished = schemas.FinishedCounts(
        total=sum(type_counts.values()),
        game=type_counts.get(MediaType.GAME.value, 0),
        dlc=type_counts.get(MediaType.DLC.value, 0),
        movie=type_counts.get(MediaType.MOVIE.value, 0),
        series=type_counts.get(MediaType.SERIES.value, 0),
        anime=type_counts.get(MediaType.ANIME.value, 0),
        book=type_counts.get(MediaType.BOOK.value, 0),
    )

    # count the number of ratings for each rating value
    rating_counts = Counter(
        entry.rating for entry in entries if entry.rating is not None
    )

    # create a new RatingBucket object for each rating value
    rating_distribution = [
        schemas.RatingBucket(rating=rating, count=rating_counts.get(rating, 0))
        for rating in range(1, 11)
    ]

    # get the 8 entries with the most recent activity
    active_entries = [
        (activity, entry)
        for entry in entries
        if (activity := _last_activity(entry)) is not None
    ]
    active_entries.sort(key=lambda pair: (pair[0], pair[1].id), reverse=True)

    return schemas.ProfileStatsResponse(
        finished=finished,
        rating_distribution=rating_distribution,
        recent_activity=[entry for _, entry in active_entries[:8]],
    )


def _last_activity(entry: models.MediaEntry) -> date | None:
    """Latest journal day, finish date or start date of an entry."""
    days = list(entry.played_dates or [])
    days += [dt.date() for dt in (entry.finished_at, entry.started_at) if dt is not None]
    return max(days, default=None)
