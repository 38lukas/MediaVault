"""SQLAlchemy models for MediaVault."""

from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class MediaEntry(Base):
    """Persisted media entry row in the media_entries table."""

    __tablename__ = "media_entries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    media_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    external_id = Column(String, nullable=False)
    poster_path = Column(String, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
