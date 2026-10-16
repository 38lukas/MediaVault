from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY

from app.database import Base


class MediaEntry(Base):
    __tablename__ = "media_entries"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(
        String,
        ForeignKey("user.username", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String, nullable=False)
    media_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    playtime = Column(Integer, nullable=True)
    release_date = Column(DateTime(timezone=True), nullable=True)
    platforms = Column(ARRAY(String), nullable=True)
    franchises = Column(ARRAY(String), nullable=True)
    genres = Column(ARRAY(String), nullable=True)
    developers = Column(ARRAY(String), nullable=True)
    publishers = Column(ARRAY(String), nullable=True)
    directors = Column(ARRAY(String), nullable=True)
    creators = Column(ARRAY(String), nullable=True)
    production_companies = Column(ARRAY(String), nullable=True)
    runtime = Column(Integer, nullable=True)
    last_air_date = Column(DateTime(timezone=True), nullable=True)
    number_of_seasons = Column(Integer, nullable=True)
    number_of_episodes = Column(Integer, nullable=True)
    original_title = Column(String, nullable=True)
    season_number = Column(Integer, nullable=True)  # Null = entry covers the whole show.
    season_name = Column(String, nullable=True)
    authors = Column(ARRAY(String), nullable=True)
    first_publish_date = Column(String, nullable=True)  # Free text from Open Library, e.g. "1937" or "September 21, 1937".
    platform_played_on = Column(String, nullable=True)
    external_id = Column(String, nullable=False, index=True)
    poster_path = Column(String, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    rating = Column(Integer, nullable=True)
    played_dates = Column(ARRAY(Date), nullable=True)
