from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY

from app.core.database import Base


class User(Base):
    __tablename__ = "user"

    username = Column(String, primary_key=True)
    # Legacy plain-text password; kept until every row has a verified password_hash, then
    # cleared in a separate step. New accounts and password changes leave it NULL.
    password = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)  # bcrypt
    joined_date = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    default_sort_field = Column(String, nullable=False, default="status")
    default_card_size = Column(Integer, nullable=False, default=2)
    default_type_filter = Column(String, nullable=False, default="All")
    avatar_path = Column(String, nullable=True)
    # Unified status labels whose library sections start expanded; NULL = all of them.
    library_loaded_statuses = Column(ARRAY(String), nullable=True)
    # Profile page elements the user hid (ids like 'achievements'); NULL = nothing hidden.
    profile_hidden_sections = Column(ARRAY(String), nullable=True)
