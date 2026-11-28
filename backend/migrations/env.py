"""Alembic environment: runs revisions against the app's engine (DATABASE_URL from the root .env)."""

from logging.config import fileConfig

from alembic import context

from app.core.database import Base, engine
from app import models  # noqa: F401  (registers all tables on Base)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """`--sql` mode is not supported: revisions run SELECTs and Python code on a live connection."""
    raise SystemExit("Offline mode (--sql) is not supported; run against a database instead.")


def run_migrations_online() -> None:
    """Run all pending revisions in one transaction.

    A caller may pass its own connection in config.attributes["connection"] (e.g. a dry run
    inside a transaction it rolls back afterwards).
    """
    given = config.attributes.get("connection")
    if given is not None:
        context.configure(connection=given, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
        return

    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
