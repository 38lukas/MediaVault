"""Media entry CRUD routes under /api."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_username
from app import models, schemas

router = APIRouter(prefix="/entries", tags=["entries"])


@router.get("", response_model=List[schemas.MediaEntryResponse])
@router.get("/", response_model=List[schemas.MediaEntryResponse], include_in_schema=False)
def get_entries(
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Return media entries belonging to the logged-in user."""
    return (
        db.query(models.MediaEntry)
        .filter(models.MediaEntry.username == username)
        .all()
    )


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
        franchise=entry_in.franchise,
        genres=entry_in.genres,
        developers=entry_in.developers,
        publishers=entry_in.publishers,
        external_id=entry_in.external_id,
        poster_path=entry_in.poster_path,
        started_at=entry_in.started_at,
        finished_at=entry_in.finished_at,
        rating=entry_in.rating,
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
    entry.franchise = entry_in.franchise
    entry.genres = entry_in.genres
    entry.developers = entry_in.developers
    entry.publishers = entry_in.publishers
    entry.external_id = entry_in.external_id
    entry.poster_path = entry_in.poster_path
    entry.started_at = entry_in.started_at
    entry.finished_at = entry_in.finished_at
    entry.rating = entry_in.rating

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
