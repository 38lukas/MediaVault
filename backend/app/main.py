from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from app.database import get_db, engine, Base
from app import models, schemas

# Create all tables in PostgreSQL that inherit from Base
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Media Tracker API")

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

@app.delete(
    "/api/v1/entries/{entry_id}", 
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    """Delete a media entry by its ID."""
 
    try:
        entry = db.query(models.MediaEntry).filter(models.MediaEntry.id == entry_id).first()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fehler beim Abrufen des Eintrags: {str(e)}"
        )
    
    db.delete(entry)
    db.commit()

    return None
