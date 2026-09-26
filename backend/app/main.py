from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import httpx

from app.database import get_db, engine, Base
from app import models, schemas
from app import igdb as igdb_service

# Create all tables in PostgreSQL that inherit from Base
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Media Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Root endpoint that returns a welcome message."""
    return {"message": "Willkommen zur Media Tracker API!"}

@app.get("/ping-db")
def ping_db(db: Session = Depends(get_db)):
    """Endpoint to check the database connection."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Erfolgreich mit PostgreSQL verbunden!"}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Datenbankverbindung fehlgeschlagen: {str(e)}"
        )

@app.get("/api/v1/igdb/cover")
def get_igdb_cover(name: str = Query(..., min_length=1)):
    """Look up an IGDB game by title and return its cover image URL."""
    try:
        return igdb_service.fetch_cover_by_name(name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"IGDB request failed: {e}",
        )

@app.post(
    "/api/v1/entries", 
    response_model=schemas.MediaEntryResponse, 
    status_code=status.HTTP_201_CREATED
)
def create_entry(
    entry_in: schemas.MediaEntryCreate, 
    db: Session = Depends(get_db)
):
    """Create a new media entry."""

    # Convert Pydantic data to a SQLAlchemy database object
    db_entry = models.MediaEntry(
        title=entry_in.title,
        media_type=entry_in.media_type,
        status=entry_in.status,
        external_id=entry_in.external_id,
        poster_path=entry_in.poster_path
    )
    
    # Add to the database
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    return db_entry

@app.get(
    "/api/v1/entries", 
    response_model=List[schemas.MediaEntryResponse]
)
def get_entries(db: Session = Depends(get_db)):
    """Get all media entries."""

    # Retrieve all entry objects
    entries = db.query(models.MediaEntry).all()
    return entries

@app.put(
    "/api/v1/entries/{entry_id}",
    response_model=schemas.MediaEntryResponse,
)
def update_entry(
    entry_id: int,
    entry_in: schemas.MediaEntryCreate,
    db: Session = Depends(get_db),
):
    """Update an existing media entry by its ID."""
    entry = db.query(models.MediaEntry).filter(models.MediaEntry.id == entry_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry.title = entry_in.title
    entry.media_type = entry_in.media_type
    entry.status = entry_in.status
    entry.external_id = entry_in.external_id
    entry.poster_path = entry_in.poster_path

    db.commit()
    db.refresh(entry)
    return entry

@app.delete(
    "/api/v1/entries/{entry_id}", 
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    """Delete a media entry by its ID."""
    entry = db.query(models.MediaEntry).filter(models.MediaEntry.id == entry_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(entry)
    db.commit()
    return None
