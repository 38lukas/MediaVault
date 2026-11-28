"""Shared test setup.

Tests must never touch a real database or external API. A dummy DATABASE_URL is set
before any app module is imported; SQLAlchemy only connects lazily, so importing the app
is safe. Routes that need a DB session override `get_db` with a fake.
"""

import os

# Always override, so a real (production) URL from the shell can never be used by tests.
os.environ["DATABASE_URL"] = "postgresql+psycopg://test:test@localhost:5432/test"

# app.core.database loads the repo-root .env, but never overrides variables that are already
# set. Pinning these first keeps real secrets out of the test process.
_DUMMY_ENV = {
    "TWITCH_CLIENT_ID": "test-client-id",
    "TWITCH_CLIENT_SECRET": "test-client-secret",
    "TMDB_ACCESS_TOKEN": "test-tmdb-token",
    "S3_BUCKET": "",
    "S3_ACCESS_KEY_ID": "",
    "S3_SECRET_ACCESS_KEY": "",
    "S3_REGION": "",
    "S3_ENDPOINT_URL": "",
    "S3_PUBLIC_BASE_URL": "",
    "S3_OBJECT_ACL": "",
    "AWS_ACCESS_KEY_ID": "",
    "AWS_SECRET_ACCESS_KEY": "",
    "AWS_REGION": "",
}
os.environ.update(_DUMMY_ENV)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core import security  # noqa: E402
from app.core.database import get_db  # noqa: E402
from app.main import app  # noqa: E402
from tests.fakes import FakeSession  # noqa: E402


@pytest.fixture(autouse=True)
def fast_bcrypt(monkeypatch):
    """Lowest bcrypt work factor, so hashing in tests takes milliseconds."""
    monkeypatch.setattr(security, "BCRYPT_ROUNDS", 4)


@pytest.fixture
def db() -> FakeSession:
    return FakeSession()


@pytest.fixture
def client(db: FakeSession):
    """TestClient whose requests all use the same in-memory fake session."""
    app.dependency_overrides[get_db] = lambda: db
    yield TestClient(app)
    app.dependency_overrides.clear()
