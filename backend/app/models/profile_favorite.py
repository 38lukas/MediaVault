from sqlalchemy import Boolean, CheckConstraint, Column, ForeignKey, Integer, String, UniqueConstraint

from app.database import Base

FAVORITE_SLOT_COUNT = 5
FAVORITE_CATEGORIES = ("All", "Game", "Movie", "Series", "Anime", "Book")


class ProfileFavorite(Base):
    __tablename__ = "profile_favorites"
    __table_args__ = (
        UniqueConstraint(
            "username",
            "category",
            "slot",
            name="uq_profile_favorites_user_category_slot",
        ),
        UniqueConstraint(
            "username",
            "category",
            "external_id",
            name="uq_profile_favorites_user_category_external",
        ),
        CheckConstraint(
            f"slot >= 0 AND slot < {FAVORITE_SLOT_COUNT}",
            name="ck_profile_favorites_slot",
        ),
        CheckConstraint(
            "category IN ('All', 'Game', 'Movie', 'Series', 'Anime', 'Book')",
            name="ck_profile_favorites_category",
        ),
    )

    id = Column(Integer, primary_key=True)
    username = Column(
        String,
        ForeignKey("user.username", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category = Column(String, nullable=False, default="All")
    slot = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    media_type = Column(String, nullable=False)
    external_id = Column(String, nullable=False)
    poster_path = Column(String, nullable=True)
    is_number_one = Column(Boolean, nullable=False, default=False)
