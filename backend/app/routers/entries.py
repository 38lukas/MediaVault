"""Media entry CRUD routes under /api."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_username
from app import models, schemas

router = APIRouter(prefix="/entries", tags=["entries"])


@router.get("", response_model=List[schemas.MediaEntryResponse])
@router.get("/", response_model=List[schemas.MediaEntryResponse], include_in_schema=False)
def get_entries(
    statuses: Optional[str] = Query(
        default=None,
        description="Comma-separated statuses to return, e.g. 'Playing,Watching'. Omit for every entry.",
    ),
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Return media entries belonging to the logged-in user, optionally limited to some statuses."""
    query = db.query(models.MediaEntry).filter(models.MediaEntry.username == username)
    if statuses is not None:
        wanted = [value.strip() for value in statuses.split(",") if value.strip()]
        query = query.filter(models.MediaEntry.status.in_(wanted))
    return query.all()


@router.get("/status-counts", response_model=List[schemas.StatusCount])
def get_status_counts(
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Entry counts per media type and status, so the library can show collapsed sections without loading them."""
    rows = (
        db.query(models.MediaEntry.media_type, models.MediaEntry.status, func.count(models.MediaEntry.id))
        .filter(models.MediaEntry.username == username)
        .group_by(models.MediaEntry.media_type, models.MediaEntry.status)
        .all()
    )
    return [schemas.StatusCount(media_type=media_type, status=status_, count=count) for media_type, status_, count in rows]


@router.post(
    "",
    response_model=schemas.MediaEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/",
    response_model=schemas.MediaEntryResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_entry(
    entry_in: schemas.MediaEntryCreate,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Create a new media entry owned by the logged-in user."""
    db_entry = models.MediaEntry(
        username=username,
        title=entry_in.title,
        media_type=entry_in.media_type,
        status=entry_in.status,
        playtime=entry_in.playtime,
        release_date=entry_in.release_date,
        platforms=entry_in.platforms,
        franchises=entry_in.franchises,
        genres=entry_in.genres,
        developers=entry_in.developers,
        publishers=entry_in.publishers,
        directors=entry_in.directors,
        creators=entry_in.creators,
        production_companies=entry_in.production_companies,
        runtime=entry_in.runtime,
        last_air_date=entry_in.last_air_date,
        number_of_seasons=entry_in.number_of_seasons,
        number_of_episodes=entry_in.number_of_episodes,
        original_title=entry_in.original_title,
        season_number=entry_in.season_number,
        season_name=entry_in.season_name,
        authors=entry_in.authors,
        first_publish_date=entry_in.first_publish_date,
        platform_played_on=entry_in.platform_played_on,
        external_id=entry_in.external_id,
        poster_path=entry_in.poster_path,
        started_at=entry_in.started_at,
        finished_at=entry_in.finished_at,
        rating=entry_in.rating,
        played_dates=entry_in.played_dates,
        rewatch_dates=entry_in.rewatch_dates,
        number_of_rewatches=entry_in.number_of_rewatches,
        is_favorite=entry_in.is_favorite,
        hide_season_name=entry_in.hide_season_name,
    )

    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.put("/{entry_id}", response_model=schemas.MediaEntryResponse)
def update_entry(
    entry_id: int,
    entry_in: schemas.MediaEntryCreate,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Update one of the logged-in user's media entries by primary key."""
    entry = (
        db.query(models.MediaEntry)
        .filter(
            models.MediaEntry.id == entry_id,
            models.MediaEntry.username == username,
        )
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry.title = entry_in.title
    entry.media_type = entry_in.media_type
    entry.status = entry_in.status
    entry.playtime = entry_in.playtime
    entry.release_date = entry_in.release_date
    entry.platforms = entry_in.platforms
    entry.franchises = entry_in.franchises
    entry.genres = entry_in.genres
    entry.developers = entry_in.developers
    entry.publishers = entry_in.publishers
    entry.directors = entry_in.directors
    entry.creators = entry_in.creators
    entry.production_companies = entry_in.production_companies
    entry.runtime = entry_in.runtime
    entry.last_air_date = entry_in.last_air_date
    entry.number_of_seasons = entry_in.number_of_seasons
    entry.number_of_episodes = entry_in.number_of_episodes
    entry.original_title = entry_in.original_title
    entry.season_number = entry_in.season_number
    entry.season_name = entry_in.season_name
    entry.authors = entry_in.authors
    entry.first_publish_date = entry_in.first_publish_date
    entry.platform_played_on = entry_in.platform_played_on
    entry.external_id = entry_in.external_id
    entry.poster_path = entry_in.poster_path
    entry.started_at = entry_in.started_at
    entry.finished_at = entry_in.finished_at
    entry.rating = entry_in.rating
    entry.played_dates = entry_in.played_dates
    entry.rewatch_dates = entry_in.rewatch_dates
    entry.number_of_rewatches = entry_in.number_of_rewatches
    entry.is_favorite = entry_in.is_favorite
    entry.hide_season_name = entry_in.hide_season_name

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Delete one of the logged-in user's media entries by primary key."""
    entry = (
        db.query(models.MediaEntry)
        .filter(
            models.MediaEntry.id == entry_id,
            models.MediaEntry.username == username,
        )
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(entry)
    db.commit()
    return None
