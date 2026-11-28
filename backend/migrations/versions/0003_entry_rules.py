"""Database rules for media_entries: valid types/statuses, rating, numbers, one entry per title.

Revision ID: 0003_entry_rules
Revises: 0002_entry_timestamps
Create Date: 2026-11-28

Before writing this, all 1566 existing entries were checked read-only: none breaks a rule.
If another database (e.g. a test branch) has violating rows, this revision fails and rolls
back as a whole; nothing is deleted or rewritten. Find the rows, fix them, run it again.

MEDIA_TYPES / ALLOWED_STATUSES are frozen copies of app/enums.py at this revision. When the
enums change, add a new revision that replaces ck_media_entries_status_for_type (a test fails
until you do).
"""

from alembic import op
from sqlalchemy import text

revision = "0003_entry_rules"
down_revision = "0002_entry_timestamps"
branch_labels = None
depends_on = None

MEDIA_TYPES = ("Movie", "Series", "Anime", "Game", "DLC", "Book")
ALLOWED_STATUSES = {
    "Movie": ("Dropped", "Watched", "Watching", "Watchlist"),
    "Series": ("Dropped", "Shelved", "Watched", "Watching", "Watchlist"),
    "Anime": ("Dropped", "Shelved", "Watched", "Watching", "Watchlist"),
    "Game": ("Backlog", "Dropped", "Finished", "Played", "Playing", "Shelved", "Wishlist"),
    "DLC": ("Backlog", "Dropped", "Finished", "Played", "Playing", "Shelved", "Wishlist"),
    "Book": ("Backlog", "Dropped", "Read", "Reading"),
}


def _quoted(values) -> str:
    return ", ".join(f"'{value}'" for value in values)


def _status_rule() -> str:
    return " OR ".join(
        f"(media_type = '{media_type}' AND status IN ({_quoted(statuses)}))"
        for media_type, statuses in ALLOWED_STATUSES.items()
    )


CHECKS = {
    "ck_media_entries_media_type": f"media_type IN ({_quoted(MEDIA_TYPES)})",
    "ck_media_entries_status_for_type": _status_rule(),
    # 0 is never stored: the API turns a 0 rating into NULL (= unrated).
    "ck_media_entries_rating": "rating IS NULL OR rating BETWEEN 1 AND 10",
    "ck_media_entries_non_negative": (
        "(playtime IS NULL OR playtime >= 0) AND (runtime IS NULL OR runtime >= 0) "
        "AND (number_of_seasons IS NULL OR number_of_seasons >= 0) "
        "AND (number_of_episodes IS NULL OR number_of_episodes >= 0) "
        "AND (number_of_rewatches IS NULL OR number_of_rewatches >= 0)"
    ),
    "ck_media_entries_season_number": "season_number IS NULL OR season_number >= 1",
}


def upgrade() -> None:
    conn = op.get_bind()
    for name, rule in CHECKS.items():
        conn.execute(text(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '{name}') THEN
                    ALTER TABLE media_entries ADD CONSTRAINT {name} CHECK ({rule});
                END IF;
            END $$;
        """))
    # One entry per user, title and season; NULLS NOT DISTINCT makes two whole-show
    # entries (season_number NULL) count as duplicates too. Also serves user+title lookups.
    conn.execute(text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_media_entries_user_external_season "
        "ON media_entries (username, external_id, season_number) NULLS NOT DISTINCT"
    ))


def downgrade() -> None:
    # Removing rules loses no data.
    conn = op.get_bind()
    conn.execute(text("DROP INDEX IF EXISTS uq_media_entries_user_external_season"))
    for name in reversed(list(CHECKS)):
        conn.execute(text(f"ALTER TABLE media_entries DROP CONSTRAINT IF EXISTS {name}"))
