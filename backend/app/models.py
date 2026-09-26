from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.database import Base


class MediaEntry(Base):
    """SQLAlchemy model for a media entry in the database."""
    __tablename__ = "media_entries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    media_type = Column(String, nullable=False)
    status = Column(String, nullable=False)     
    external_id = Column(String, nullable=False)
    poster_path = Column(String, nullable=True)
    watched_at = Column(DateTime(timezone=True), nullable=True)