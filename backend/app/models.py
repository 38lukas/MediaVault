from sqlalchemy import Column, Integer, String, DateTime, Enum
from datetime import datetime, timezone
import enum
from app.database import Base

class MediaType(str, enum.Enum):
    """Enumeration of possible media types."""
    MOVIE = "movie"
    SERIES = "series"
    ANIME = "anime"

class MediaEntry(Base):
    """Database model for a media entry."""
    __tablename__ = "media_entries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    media_type = Column(Enum(MediaType), nullable=False)

    # External ID from the API
    external_id = Column(String, nullable=False)
    poster_path = Column(String, nullable=True)

    # Timestamp for when the media entry was watched
    watched_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc)
    )