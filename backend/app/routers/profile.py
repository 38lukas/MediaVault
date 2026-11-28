"""Profile stats routes under /api/profile."""

from collections import Counter
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_username
from app.models.profile_favorite import FAVORITE_CATEGORIES, FAVORITE_SLOT_COUNT
from app import models, schemas
from app.services import profile_stats

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/stats", response_model=schemas.ProfileStatsResponse)
def get_profile_stats(
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Aggregate finished counts, rating histogram, and recently active entries."""
    return build_profile_stats(db, username)


def build_profile_stats(db: Session, username: str) -> schemas.ProfileStatsResponse:
    """Profile stats for one user (the logged-in user, or a friend in friend view)."""
    # get all entries for the current user
    entries = (
        db.query(models.MediaEntry)
        .filter(models.MediaEntry.username == username)
        .all()
    )

    finished_year = datetime.now(timezone.utc).year
    finished = profile_stats.finished_counts(entries)
    finished_this_year = profile_stats.finished_counts(entries, year=finished_year)

    # count the number of ratings for each rating value
    # A stored 0 counts as unrated, like null.
    rating_counts = Counter(entry.rating for entry in entries if entry.rating)

    # create a new RatingBucket object for each rating value
    rating_distribution = [
        schemas.RatingBucket(rating=rating, count=rating_counts.get(rating, 0))
        for rating in range(1, 11)
    ]

    unrated_count = sum(1 for entry in entries if not entry.rating)

    # get the 8 entries with the most recent activity
    active_entries = [
        (activity, entry)
        for entry in entries
        if (activity := profile_stats.last_activity(entry)) is not None
    ]
    active_entries.sort(key=lambda pair: (pair[0], pair[1].id), reverse=True)

    logged_counts = Counter(entry.media_type for entry in entries)

    owner = db.query(models.User).filter(models.User.username == username).first()
    hidden_sections = list(owner.profile_hidden_sections or []) if owner else []

    return schemas.ProfileStatsResponse(
        finished=finished,
        finished_this_year=finished_this_year,
        finished_year=finished_year,
        rating_distribution=rating_distribution,
        unrated_count=unrated_count,
        recent_activity=[entry for _, entry in active_entries[:8]],
        achievements=profile_stats.log_achievements(logged_counts),
        favorites=_favorite_groups(db, username),
        hidden_sections=hidden_sections,
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
