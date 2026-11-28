"""Static guard rails for the Alembic revisions; the SQL itself is checked against Neon by hand."""

import re

import pytest
from alembic.script import ScriptDirectory

from app.core import migrations
from app.core.security import hash_password, verify_password


class FakeResult:
    def __init__(self, rows):
        self.rows = rows

    def all(self):
        return self.rows


class RecordingConnection:
    def __init__(self, select_rows=()):
        self.statements: list[str] = []
        self.params: list[dict | None] = []
        self.select_rows = list(select_rows)

    def execute(self, statement, params=None):
        self.statements.append(str(statement))
        self.params.append(params)
        return FakeResult(self.select_rows if params is None else [])


def revisions():
    """Revision scripts from first to last."""
    script = ScriptDirectory.from_config(migrations.alembic_config())
    return list(reversed(list(script.walk_revisions())))


def run_upgrade(revision, monkeypatch, connection=None):
    connection = connection or RecordingConnection()
    monkeypatch.setattr(revision.module.op, "get_bind", lambda: connection, raising=False)
    revision.module.upgrade()
    return [" ".join(sql.split()).upper() for sql in connection.statements]


@pytest.fixture
def statements(monkeypatch):
    """SQL of every revision's upgrade, in order."""
    return [sql for revision in revisions() for sql in run_upgrade(revision, monkeypatch)]


def test_history_is_one_straight_line():
    script = ScriptDirectory.from_config(migrations.alembic_config())
    assert len(script.get_heads()) == 1
    chain = revisions()
    assert chain[0].revision == "0001_baseline" and chain[0].down_revision is None
    for previous, current in zip(chain, chain[1:]):
        assert current.down_revision == previous.revision


def test_run_migrations_upgrades_to_head(monkeypatch):
    calls = []
    monkeypatch.setattr(migrations.command, "upgrade", lambda config, target: calls.append(target))
    migrations.run_migrations()
    assert calls == ["head"]


def test_never_drops_a_table(statements):
    assert not any(re.search(r"\bDROP TABLE\b", sql) for sql in statements)


def test_top_level_drops_and_adds_are_guarded(statements):
    for sql in statements:
        if sql.startswith("DO $$"):
            continue
        if re.search(r"\bDROP (COLUMN|CONSTRAINT|INDEX)\b", sql):
            assert "IF EXISTS" in sql, sql
        if re.search(r"\b(ADD COLUMN|CREATE TABLE|CREATE (UNIQUE )?INDEX)\b", sql):
            assert "IF NOT EXISTS" in sql, sql


def test_do_blocks_check_before_changing_schema(statements):
    for sql in statements:
        if sql.startswith("DO $$") and re.search(r"\bDROP COLUMN\b(?! IF EXISTS)", sql):
            assert "IF EXISTS (" in sql, sql


def test_timestamps_do_not_backfill_existing_rows(monkeypatch):
    timestamps = next(r for r in revisions() if r.revision == "0002_entry_timestamps")
    sql = run_upgrade(timestamps, monkeypatch)
    adds = [s for s in sql if "ADD COLUMN" in s]
    assert len(adds) == 2 and not any("DEFAULT" in s for s in adds)
    assert sum("SET DEFAULT NOW()" in s for s in sql) == 2


def test_baseline_fills_missing_and_stale_hashes_only(monkeypatch):
    baseline = revisions()[0].module
    fast_salt = baseline.bcrypt.gensalt
    monkeypatch.setattr(baseline.bcrypt, "gensalt", lambda *args, **kwargs: fast_salt(rounds=4))
    rows = [
        ("alice", "secret", None),  # no hash yet
        ("bob", "new-pw", hash_password("old-pw")),  # stale hash
        ("carol", "same", hash_password("same")),  # already fine
        ("long", "x" * 73, None),  # too long for bcrypt
    ]
    connection = RecordingConnection(select_rows=rows)
    baseline._hash_plaintext_passwords(connection)
    updates = [(sql, params) for sql, params in zip(connection.statements, connection.params) if params]
    assert [params["username"] for _, params in updates] == ["alice", "bob"]
    assert verify_password("new-pw", updates[1][1]["hash"])
    assert all("SET password_hash" in sql and "password =" not in sql.replace("password_hash", "")
               for sql, _ in updates)


def test_no_revision_drops_a_column_that_a_later_one_adds(monkeypatch):
    # Re-running an old revision must not delete data of a column added later.
    dropped, added = [], []
    for revision in revisions():
        for sql in run_upgrade(revision, monkeypatch):
            if sql.startswith("DO $$"):
                continue
            dropped += [(revision.revision, c) for c in re.findall(r"DROP COLUMN IF EXISTS (\w+)", sql)]
            added += [(revision.revision, c) for c in re.findall(r"ADD COLUMN IF NOT EXISTS (\w+)", sql)]
    order = [r.revision for r in revisions()]
    for drop_rev, column in dropped:
        assert not any(c == column and order.index(add_rev) > order.index(drop_rev) for add_rev, c in added), column
