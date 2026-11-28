"""Shared test setup.

Tests must never touch a real database or external API. A dummy DATABASE_URL is set
before any app module is imported; SQLAlchemy only connects lazily, so importing the app
is safe. Routes that need a DB session override `get_db` with a fake.
"""

import os

# Always override, so a real (production) URL from the shell can never be used by tests.
os.environ["DATABASE_URL"] = "postgresql+psycopg://test:test@localhost:5432/test"
