"""Media entry CRUD routes under /api/v1."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/entries", tags=["entries"])


@router.get("", response_model=List[schemas.MediaEntryResponse])
@router.get("/", response_model=List[schemas.MediaEntryResponse], include_in_schema=False)
def get_entries(db: Session = Depends(get_db)):
    """Return all media entries from the database."""
    return db.query(models.MediaEntry).all()


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
):
    """Create a new media entry and persist it to PostgreSQL."""
    db_entry = models.MediaEntry(
        title=entry_in.title,
        media_type=entry_in.media_type,
        status=entry_in.status,
        external_id=entry_in.external_id,
        poster_path=entry_in.poster_path,
        started_at=entry_in.started_at,
        finished_at=entry_in.finished_at,
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
):
    """Update an existing media entry by its primary key."""
    entry = db.query(models.MediaEntry).filter(models.MediaEntry.id == entry_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry.title = entry_in.title
    entry.media_type = entry_in.media_type
    entry.status = entry_in.status
    entry.external_id = entry_in.external_id
    entry.poster_path = entry_in.poster_path
    entry.started_at = entry_in.started_at
    entry.finished_at = entry_in.finished_at

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    """Delete a media entry by its primary key."""
    entry = db.query(models.MediaEntry).filter(models.MediaEntry.id == entry_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(entry)
    db.commit()
    return None
