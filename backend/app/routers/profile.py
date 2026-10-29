"""Profile stats routes under /api/profile."""

from collections import Counter
from datetime import date, datetime, timezone
from typing import NamedTuple

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_username
from app.enums import MediaStatus, MediaType
from app.models.profile_favorite import FAVORITE_CATEGORIES, FAVORITE_SLOT_COUNT
from app import models, schemas

router = APIRouter(prefix="/profile", tags=["profile"])

class _LogAchievement(NamedTuple):
    id: str
    title: str
    description: str
    media_type: str
    threshold: int
    image: str | None
    rarity: str


def _log_milestones(
    prefix: str,
    media_type: str,
    noun: str,
    titles: tuple[str, str, str, str],
    image: str | None = None,
) -> list[_LogAchievement]:
    """Bronze/silver/gold/platinum milestones for logging one media type."""
    steps = (
        (10, "Bronze"),
        (50, "Silver"),
        (100, "Gold"),
        (250, "Platinum"),
    )
    return [
        _LogAchievement(
            f"{prefix}_log_{threshold}",
            title,
            f"Log {threshold} {noun} on your profile",
            media_type,
            threshold,
            image,
            rarity,
        )
        for (threshold, rarity), title in zip(steps, titles)
    ]


# Drop icons in frontend/public/achievements and set image to the public URL,
# e.g. "/achievements/getting-started.svg". Rarer tiers are the harder milestones.
_LOG_ACHIEVEMENTS = [
    *_log_milestones(
        "game",
        MediaType.GAME.value,
        "games",
        ("Getting Started", "Novice Game Collector", "Master Game Collector", "Legendary Collector"),
        "/achievements/getting-started.svg",
    ),
    *_log_milestones(
        "movie",
        MediaType.MOVIE.value,
        "movies",
        ("Now Showing", "Novice Movie Collector", "Master Movie Collector", "Cinema Legend"),
        "/achievements/movies.svg",
    ),
    *_log_milestones(
        "series",
        MediaType.SERIES.value,
        "series",
        ("Pilot Episode", "Novice Series Collector", "Master Series Collector", "Television Legend"),
        "/achievements/series.svg",
    ),
    *_log_milestones(
        "anime",
        MediaType.ANIME.value,
        "anime",
        ("First Episode", "Novice Anime Collector", "Master Anime Collector", "Anime Legend"),
        "/achievements/anime.svg",
    ),
    *_log_milestones(
        "book",
        MediaType.BOOK.value,
        "books",
        ("First Chapter", "Novice Book Collector", "Master Book Collector", "Library Legend"),
        "/achievements/books.svg",
    ),
]

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

    finished_year = datetime.now(timezone.utc).year
    finished = _finished_counts(entries)
    finished_this_year = _finished_counts(entries, year=finished_year)

    # count the number of ratings for each rating value
    rating_counts = Counter(
        entry.rating for entry in entries if entry.rating is not None
    )

    # create a new RatingBucket object for each rating value
    rating_distribution = [
        schemas.RatingBucket(rating=rating, count=rating_counts.get(rating, 0))
        for rating in range(1, 11)
    ]

    unrated_count = sum(1 for entry in entries if entry.rating is None)

    # get the 8 entries with the most recent activity
    active_entries = [
        (activity, entry)
        for entry in entries
        if (activity := _last_activity(entry)) is not None
    ]
    active_entries.sort(key=lambda pair: (pair[0], pair[1].id), reverse=True)

    logged_counts = Counter(entry.media_type for entry in entries)

    return schemas.ProfileStatsResponse(
        finished=finished,
        finished_this_year=finished_this_year,
        finished_year=finished_year,
        rating_distribution=rating_distribution,
        unrated_count=unrated_count,
        recent_activity=[entry for _, entry in active_entries[:8]],
        achievements=_log_achievements(logged_counts),
        favorites=_favorite_groups(db, username),
    )


@router.put("/favorites/{slot}", response_model=list[schemas.FavoriteGroup])
def update_favorite_slot(
    body: schemas.FavoriteSlotUpdate,
    slot: int = Path(ge=0, le=FAVORITE_SLOT_COUNT - 1),
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Set, replace, or clear one favorite slot, and optionally mark it as #1."""
    existing = (
        db.query(models.ProfileFavorite)
        .filter(
            models.ProfileFavorite.username == username,
            models.ProfileFavorite.category == body.category,
            models.ProfileFavorite.slot == slot,
        )
        .first()
    )

    if body.title is None:
        if existing is not None:
            db.delete(existing)
            db.commit()
        return _favorite_groups(db, username)

    duplicate = (
        db.query(models.ProfileFavorite)
        .filter(
            models.ProfileFavorite.username == username,
            models.ProfileFavorite.category == body.category,
            models.ProfileFavorite.external_id == body.external_id,
            models.ProfileFavorite.slot != slot,
        )
        .first()
    )
    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That title is already in this favorites list",
        )

    if body.is_number_one:
        (
            db.query(models.ProfileFavorite)
            .filter(
                models.ProfileFavorite.username == username,
                models.ProfileFavorite.category == body.category,
                models.ProfileFavorite.slot != slot,
            )
            .update({"is_number_one": False}, synchronize_session="fetch")
        )
        db.flush()

    if existing is None:
        existing = models.ProfileFavorite(
            username=username,
            category=body.category,
            slot=slot,
            title=body.title,
            media_type=body.media_type.value,
            external_id=body.external_id,
            poster_path=body.poster_path,
            is_number_one=body.is_number_one,
        )
        db.add(existing)
    else:
        existing.title = body.title
        existing.media_type = body.media_type.value
        existing.external_id = body.external_id
        existing.poster_path = body.poster_path
        existing.is_number_one = body.is_number_one

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That title is already in this favorites list",
        )

    return _favorite_groups(db, username)


def _favorite_groups(db: Session, username: str) -> list[schemas.FavoriteGroup]:
    """Every favorites list, each with five slots. Missing rows are empty slots."""
    rows = (
        db.query(models.ProfileFavorite)
        .filter(models.ProfileFavorite.username == username)
        .all()
    )
    by_key = {(row.category, row.slot): row for row in rows}
    groups: list[schemas.FavoriteGroup] = []
    for category in FAVORITE_CATEGORIES:
        slots: list[schemas.FavoriteSlot] = []
        for slot in range(FAVORITE_SLOT_COUNT):
            row = by_key.get((category, slot))
            if row is None:
                slots.append(schemas.FavoriteSlot(slot=slot))
                continue
            slots.append(
                schemas.FavoriteSlot(
                    slot=slot,
                    title=row.title,
                    media_type=row.media_type,
                    external_id=row.external_id,
                    poster_path=row.poster_path,
                    is_number_one=bool(row.is_number_one),
                )
            )
        groups.append(schemas.FavoriteGroup(category=category, slots=slots))
    return groups


def _completion_year(finished_at: datetime) -> int:
    """Calendar year of a finish date. Finish dates are stored as UTC midnight."""
    if finished_at.tzinfo is None:
        return finished_at.year
    return finished_at.astimezone(timezone.utc).year


def _finished_counts(entries: list[models.MediaEntry], year: int | None = None) -> schemas.FinishedCounts:
    """Finished entries. A year limits the count to completions dated in that year."""
    type_counts = Counter(
        entry.media_type
        for entry in entries
        if entry.status in _FINISHED_STATUSES
        and (
            year is None
            or (
                entry.finished_at is not None
                and _completion_year(entry.finished_at) == year
            )
        )
    )
    return schemas.FinishedCounts(
        total=sum(type_counts.values()),
        game=type_counts.get(MediaType.GAME.value, 0),
        dlc=type_counts.get(MediaType.DLC.value, 0),
        movie=type_counts.get(MediaType.MOVIE.value, 0),
        series=type_counts.get(MediaType.SERIES.value, 0),
        anime=type_counts.get(MediaType.ANIME.value, 0),
        book=type_counts.get(MediaType.BOOK.value, 0),
    )


def _log_achievements(logged_counts: Counter) -> list[schemas.Achievement]:
    """Unlock log achievements from how many entries of each type are on the profile."""
    return [
        schemas.Achievement(
            id=achievement.id,
            title=achievement.title,
            description=achievement.description,
            unlocked=logged_counts.get(achievement.media_type, 0) >= achievement.threshold,
            rarity=achievement.rarity,
            image=achievement.image,
        )
        for achievement in _LOG_ACHIEVEMENTS
    ]


def _last_activity(entry: models.MediaEntry) -> date | None:
    """Latest journal day, finish date or start date of an entry."""
    days = list(entry.played_dates or [])
    days += [dt.date() for dt in (entry.finished_at, entry.started_at) if dt is not None]
    return max(days, default=None)
