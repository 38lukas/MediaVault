"""FastAPI application entrypoint for MediaVault."""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db, engine, Base
from app.routers import entries, igdb

# Create all tables in PostgreSQL that inherit from Base
Base.metadata.create_all(bind=engine)

# create_all does not alter existing tables; sync date columns.
with engine.begin() as connection:
    connection.execute(text("ALTER TABLE media_entries DROP COLUMN IF EXISTS created_at"))
    connection.execute(text("ALTER TABLE media_entries DROP COLUMN IF EXISTS watched_at"))
    connection.execute(
        text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ")
    )
    connection.execute(
        text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ")
    )

# redirect_slashes=True (default): /entries and /entries/ both resolve cleanly.
app = FastAPI(title="Media Tracker API", redirect_slashes=True)

# CORS: allow browser calls from the static frontend (and local Next.js).
# Using "*" avoids missing Access-Control-Allow-Origin after Render deploys.
# credentials must be False when origins is "*".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Versioned API: /api/v1/entries, /api/v1/igdb/cover
app.include_router(entries.router, prefix="/api/v1")
app.include_router(igdb.router, prefix="/api/v1")


@app.get("/")
def root():
    """Return a simple welcome payload for the API root."""
    return {"message": "Willkommen zur Media Tracker API!"}


@app.get("/health")
def health():
    """Lightweight healthcheck for Render / uptime monitors."""
    return {"status": "ok"}


@app.get("/ping-db")
def ping_db(db: Session = Depends(get_db)):
    """Verify the PostgreSQL connection with a trivial SELECT."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Erfolgreich mit PostgreSQL verbunden!"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Datenbankverbindung fehlgeschlagen: {str(e)}"
        )
