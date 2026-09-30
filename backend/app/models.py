"""SQLAlchemy models for MediaVault."""
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from app.database import Base

# This represents the user table in the database.
class User(Base):
    """Persisted account row in the user table."""

    __tablename__ = "user"

    # User information
    username = Column(String, primary_key=True)
    password = Column(String, nullable=False)
    joined_date = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # User settings
    ratings_enabled = Column(Boolean, nullable=False, default=True)
    default_sort_field = Column(String, nullable=False, default="status")

# This represents the media_entries table in the database.
class MediaEntry(Base):
    """Persisted media entry row in the media_entries table."""

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
    external_id = Column(String, nullable=False)
    poster_path = Column(String, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    rating = Column(Integer, nullable=True)
