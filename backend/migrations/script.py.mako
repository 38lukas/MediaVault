"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

Rules (CLAUDE.md): statements idempotent (IF [NOT] EXISTS / guarded DO blocks); never drop
or rewrite data in the same change that stops using it; back up before destructive steps.
"""

from alembic import op
from sqlalchemy import text
${imports if imports else ""}
revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends_on = ${repr(depends_on)}


def upgrade() -> None:
    conn = op.get_bind()
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    conn = op.get_bind()
    ${downgrades if downgrades else "pass"}
