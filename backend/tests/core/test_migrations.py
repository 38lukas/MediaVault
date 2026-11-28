"""Static guard rails for run_migrations(); the SQL itself is checked against Neon by hand."""

import re
from contextlib import contextmanager

import pytest

from app.core import migrations
from app.core.security import hash_password, verify_password


class FakeResult:
    def __init__(self, rows):
        self.rows = rows

    def all(self):
        return self.rows


@pytest.fixture
def statements(monkeypatch):
    """Run the migrations against a fake engine and return the SQL they would execute."""
    executed: list[str] = []

    class FakeConnection:
        def execute(self, statement, params=None):
            executed.append(str(statement))
            return FakeResult([])

    class FakeEngine:
        @contextmanager
        def begin(self):
            yield FakeConnection()

    monkeypatch.setattr(migrations, "engine", FakeEngine())
    monkeypatch.setattr(migrations.Base.metadata, "create_all", lambda bind: None)
    migrations.run_migrations()
    return [" ".join(sql.split()).upper() for sql in executed]


def top_level(statements):
    """Statements outside guarded DO $$ ... $$ blocks."""
    return [sql for sql in statements if not sql.startswith("DO $$")]


def test_never_drops_a_table(statements):
    assert not any(re.search(r"\bDROP TABLE\b", sql) for sql in statements)


def test_top_level_drops_and_adds_are_guarded(statements):
    for sql in top_level(statements):
        if re.search(r"\bDROP (COLUMN|CONSTRAINT|INDEX)\b", sql):
            assert "IF EXISTS" in sql, sql
        if re.search(r"\b(ADD COLUMN|CREATE TABLE|CREATE (UNIQUE )?INDEX)\b", sql):
            assert "IF NOT EXISTS" in sql, sql


def test_do_blocks_check_before_changing_schema(statements):
    for sql in statements:
        if sql.startswith("DO $$") and re.search(r"\bDROP COLUMN\b(?! IF EXISTS)", sql):
            assert "IF EXISTS (" in sql, sql


def test_hash_plaintext_passwords_fills_missing_and_stale_hashes_only():
    updates = []
    rows = [
        ("alice", "secret", None),  # no hash yet
        ("bob", "new-pw", hash_password("old-pw")),  # stale hash
        ("carol", "same", hash_password("same")),  # already fine
        ("long", "x" * 73, None),  # too long for bcrypt
    ]

    class Connection:
        def execute(self, statement, params=None):
            if params is None:  # the SELECT
                return FakeResult(rows)
            updates.append((str(statement), params))

    assert migrations.hash_plaintext_passwords(Connection()) == 2
    assert [params["username"] for _, params in updates] == ["alice", "bob"]
    assert verify_password("new-pw", updates[1][1]["hash"])
    sql = updates[0][0]
    assert "SET password_hash" in sql and "password =" not in sql.replace("password_hash", "")
