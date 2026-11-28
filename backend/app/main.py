import os

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app import models  # noqa: F401
from app.core.migrations import run_migrations
from app.routers import auth, entries, friend_view, friends, igdb, lists, openlibrary, profile, tmdb, users

# Schema migrations no longer run on every startup (that slowed down cold starts).
# Run them with `python -m app.core.migrations`, or set RUN_MIGRATIONS=1 to run them on boot.
if os.getenv("RUN_MIGRATIONS", "").strip().lower() in {"1", "true", "yes"}:
    run_migrations()

app = FastAPI(title="Media Tracker API", redirect_slashes=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(entries.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(friends.router, prefix="/api")
app.include_router(friend_view.router, prefix="/api")
app.include_router(lists.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(igdb.router, prefix="/api")
app.include_router(openlibrary.router, prefix="/api")
app.include_router(tmdb.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Willkommen zur Media Tracker API!"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ping-db")
def ping_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Erfolgreich mit PostgreSQL verbunden!"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Datenbankverbindung fehlgeschlagen: {str(e)}"
        )
