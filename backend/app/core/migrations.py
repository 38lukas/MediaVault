"""Database schema migrations for MediaVault (Alembic).

Revisions live in backend/migrations/versions/. They do not run on every API startup
(that slowed down Render cold starts); run them when you deploy a schema change:

    cd backend
    python -m app.core.migrations      # same as: alembic upgrade head

or set RUN_MIGRATIONS=1 in the environment before starting the API. New schema change:
`alembic revision -m "what it does"`, then write idempotent SQL in the generated file.
"""

from pathlib import Path

from alembic import command
from alembic.config import Config

ALEMBIC_INI = Path(__file__).resolve().parents[2] / "alembic.ini"


def alembic_config() -> Config:
    """Alembic config for backend/alembic.ini, independent of the working directory."""
    return Config(str(ALEMBIC_INI))


def run_migrations() -> None:
    """Apply every revision that the database does not have yet."""
    command.upgrade(alembic_config(), "head")


if __name__ == "__main__":
    run_migrations()
    print("Migrations applied.")
