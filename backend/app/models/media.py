from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY

from app.core.database import Base
from app.enums import ALLOWED_STATUSES, MediaType

UNIQUE_ENTRY_INDEX = "uq_media_entries_user_external_season"


def _quoted(values) -> str:
    return ", ".join(f"'{value}'" for value in values)


# Same rules as migrations/versions/0003_entry_rules.py (the database enforces them).
_STATUS_RULE = " OR ".join(
    f"(media_type = '{media_type.value}' AND status IN ({_quoted(sorted(s.value for s in statuses))}))"
    for media_type, statuses in ALLOWED_STATUSES.items()
)


class MediaEntry(Base):
    __tablename__ = "media_entries"
    __table_args__ = (
        CheckConstraint(f"media_type IN ({_quoted(t.value for t in MediaType)})", name="ck_media_entries_media_type"),
        CheckConstraint(_STATUS_RULE, name="ck_media_entries_status_for_type"),
        CheckConstraint("rating IS NULL OR rating BETWEEN 1 AND 10", name="ck_media_entries_rating"),
        CheckConstraint(
            "(playtime IS NULL OR playtime >= 0) AND (runtime IS NULL OR runtime >= 0) "
            "AND (number_of_seasons IS NULL OR number_of_seasons >= 0) "
            "AND (number_of_episodes IS NULL OR number_of_episodes >= 0) "
            "AND (number_of_rewatches IS NULL OR number_of_rewatches >= 0)",
            name="ck_media_entries_non_negative",
        ),
        CheckConstraint("season_number IS NULL OR season_number >= 1", name="ck_media_entries_season_number"),
        # One entry per user, title and season (two whole-show entries count as duplicates).
        Index(
            UNIQUE_ENTRY_INDEX,
            "username",
            "external_id",
            "season_number",
            unique=True,
            postgresql_nulls_not_distinct=True,
        ),
    )

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
    rewatch_dates = Column(ARRAY(Date), nullable=True)
    number_of_rewatches = Column(Integer, nullable=True)  # Rewatches (movie/series/anime) or replays (game/DLC).
    is_favorite = Column(Boolean, nullable=False, default=False, server_default="false")
    hide_season_name = Column(Boolean, nullable=False, default=False, server_default="false")
    # Set by the database; NULL for entries created before these columns existed.
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now(), onupdate=func.now())
