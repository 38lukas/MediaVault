"""Static guard rails for run_migrations(); the SQL itself is checked against Neon by hand."""

import re
from contextlib import contextmanager

import pytest

from app.core import migrations


@pytest.fixture
def statements(monkeypatch):
    """Run the migrations against a fake engine and return the SQL they would execute."""
    executed: list[str] = []

    class FakeConnection:
        def execute(self, statement):
            executed.append(str(statement))

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
