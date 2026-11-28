"""Add created_at / updated_at to media_entries.

Revision ID: 0002_entry_timestamps
Revises: 0001_baseline
Create Date: 2026-11-28

Existing rows keep NULL: their real creation time is unknown, and backfilling "now" would
record a wrong date. The DEFAULT is set in a separate statement so it only applies to new rows.
"""

from alembic import op
from sqlalchemy import text

revision = "0002_entry_timestamps"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ"))
    conn.execute(text("ALTER TABLE media_entries ALTER COLUMN created_at SET DEFAULT now()"))
    conn.execute(text("ALTER TABLE media_entries ALTER COLUMN updated_at SET DEFAULT now()"))


def downgrade() -> None:
    # Only ever run by hand (`alembic downgrade 0001_baseline`); loses the recorded timestamps.
    conn = op.get_bind()
    conn.execute(text("ALTER TABLE media_entries DROP COLUMN IF EXISTS updated_at"))
    conn.execute(text("ALTER TABLE media_entries DROP COLUMN IF EXISTS created_at"))
