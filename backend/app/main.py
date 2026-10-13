from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db, engine, Base
from app import models  # noqa: F401
from app.routers import auth, entries, friends, igdb, openlibrary, profile, tmdb, users

Base.metadata.create_all(bind=engine)

with engine.begin() as connection:
    connection.execute(text("ALTER TABLE media_entries DROP COLUMN IF EXISTS created_at"))
    connection.execute(text("ALTER TABLE media_entries DROP COLUMN IF EXISTS watched_at"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS username VARCHAR"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS rating INTEGER"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS playtime INTEGER"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS release_date TIMESTAMPTZ"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS platforms VARCHAR[]"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS franchises VARCHAR[]"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS genres VARCHAR[]"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS developers VARCHAR[]"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS publishers VARCHAR[]"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS directors VARCHAR[]"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS creators VARCHAR[]"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS production_companies VARCHAR[]"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS runtime INTEGER"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS last_air_date TIMESTAMPTZ"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS number_of_seasons INTEGER"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS number_of_episodes INTEGER"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS original_title VARCHAR"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS authors VARCHAR[]"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS first_publish_date VARCHAR"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS platform_played_on VARCHAR"))
    connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS played_dates DATE[]"))
    connection.execute(text('ALTER TABLE "user" DROP COLUMN IF EXISTS ratings_enabled'))
    connection.execute(text("""ALTER TABLE "user" ADD COLUMN IF NOT EXISTS default_sort_field VARCHAR NOT NULL DEFAULT 'status'"""))
    connection.execute(text("""ALTER TABLE "user" ADD COLUMN IF NOT EXISTS default_card_size INTEGER NOT NULL DEFAULT 2"""))
    connection.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS avatar_path VARCHAR'))
    connection.execute(text("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'user'
                  AND column_name = 'profile_picture_path'
            ) THEN
                EXECUTE 'UPDATE "user" SET avatar_path = profile_picture_path WHERE avatar_path IS NULL';
                EXECUTE 'ALTER TABLE "user" DROP COLUMN profile_picture_path';
            END IF;
        END $$;
    """))
    connection.execute(text("ALTER TABLE media_entries DROP CONSTRAINT IF EXISTS media_entries_username_fkey"))
    connection.execute(text(
        'ALTER TABLE media_entries '
        'ADD CONSTRAINT media_entries_username_fkey '
        'FOREIGN KEY (username) REFERENCES "user"(username) '
        'ON UPDATE CASCADE'
    ))
    connection.execute(text("""
        CREATE TABLE IF NOT EXISTS friendships (
            id SERIAL PRIMARY KEY,
            owner_username VARCHAR NOT NULL REFERENCES "user"(username)
                ON UPDATE CASCADE ON DELETE CASCADE,
            friend_username VARCHAR NOT NULL REFERENCES "user"(username)
                ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT uq_friendships_owner_friend UNIQUE (owner_username, friend_username)
        )
    """))
    connection.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_friendships_owner_username ON friendships (owner_username)"
    ))
    connection.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_friendships_friend_username ON friendships (friend_username)"
    ))

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
