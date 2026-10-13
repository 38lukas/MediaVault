from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "user"

    username = Column(String, primary_key=True)
    password = Column(String, nullable=False)
    joined_date = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    default_sort_field = Column(String, nullable=False, default="status")
    default_card_size = Column(Integer, nullable=False, default=2)
    default_type_filter = Column(String, nullable=False, default="All")
    avatar_path = Column(String, nullable=True)
