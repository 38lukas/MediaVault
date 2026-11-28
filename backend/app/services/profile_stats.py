"""Pure profile-stat helpers: finished counts, log achievements, last activity."""

from collections import Counter
from datetime import date, datetime, timezone
from typing import NamedTuple

from app import models, schemas
from app.enums import MediaStatus, MediaType


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
LOG_ACHIEVEMENTS = [
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
FINISHED_STATUSES = {
    MediaStatus.FINISHED.value,
    MediaStatus.PLAYED.value,
    MediaStatus.WATCHED.value,
    MediaStatus.READ.value,
}


def completion_year(finished_at: datetime) -> int:
    """Calendar year of a finish date. Finish dates are stored as UTC midnight."""
    if finished_at.tzinfo is None:
        return finished_at.year
    return finished_at.astimezone(timezone.utc).year


def finished_counts(entries: list[models.MediaEntry], year: int | None = None) -> schemas.FinishedCounts:
    """Finished entries. A year limits the count to completions dated in that year."""
    type_counts = Counter(
        entry.media_type
        for entry in entries
        if entry.status in FINISHED_STATUSES
        and (
            year is None
            or (
                entry.finished_at is not None
                and completion_year(entry.finished_at) == year
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


def log_achievements(logged_counts: Counter) -> list[schemas.Achievement]:
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
        for achievement in LOG_ACHIEVEMENTS
    ]


def last_activity(entry: models.MediaEntry) -> date | None:
    """Latest journal day, finish date or start date of an entry."""
    days = list(entry.played_dates or [])
    days += [dt.date() for dt in (entry.finished_at, entry.started_at) if dt is not None]
    return max(days, default=None)
