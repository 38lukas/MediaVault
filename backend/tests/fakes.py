"""In-memory stand-in for a SQLAlchemy Session, for route tests.

Supports only what the routers use: query() on models or model columns, inner join(),
filter() with ==, !=, <, >, in_ and and_, order_by() with asc/desc, first/all/count,
bulk delete()/update(), plus add/delete/commit/flush/refresh/rollback. Database-side
behaviour (constraints, cascades, ARRAY semantics) is not simulated.
"""

from __future__ import annotations

import operator
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlalchemy.sql import operators
from sqlalchemy.sql.elements import BinaryExpression, BindParameter, BooleanClauseList, UnaryExpression

from app import models
from app.core.security import create_access_token

_OPS = {
    operators.eq: operator.eq,
    operators.ne: operator.ne,
    operators.lt: operator.lt,
    operators.le: operator.le,
    operators.gt: operator.gt,
    operators.ge: operator.ge,
    operators.in_op: lambda left, right: left in right,
    operators.not_in_op: lambda left, right: left not in right,
}

Row = dict[str, Any]  # table name -> model instance


def _value(expr: Any, row: Row) -> Any:
    if isinstance(expr, BindParameter):
        return expr.effective_value
    if hasattr(expr, "table") and hasattr(expr, "key"):  # a Column
        obj = row.get(expr.table.name)
        return None if obj is None else getattr(obj, expr.key)
    raise NotImplementedError(f"FakeSession cannot evaluate {expr!r}")


def _matches(clause: Any, row: Row) -> bool:
    if isinstance(clause, BooleanClauseList):
        results = [_matches(c, row) for c in clause.clauses]
        return all(results) if clause.operator is operators.and_ else any(results)
    if isinstance(clause, BinaryExpression):
        op = _OPS.get(clause.operator)
        if op is None:
            raise NotImplementedError(f"FakeSession cannot evaluate operator {clause.operator}")
        return bool(op(_value(clause.left, row), _value(clause.right, row)))
    raise NotImplementedError(f"FakeSession cannot evaluate {clause!r}")


def _table_name(entity: Any) -> str:
    if isinstance(entity, InstrumentedAttribute):
        return entity.class_.__tablename__
    return entity.__tablename__


class FakeQuery:
    def __init__(self, session: "FakeSession", entities: tuple, rows: list[Row] | None = None):
        self.session = session
        self.entities = entities
        self.base = _table_name(entities[0])
        if rows is None:
            rows = [{self.base: obj} for obj in session.data[self.base]]
        self.rows = rows

    def _with(self, rows: list[Row]) -> "FakeQuery":
        return FakeQuery(self.session, self.entities, rows)

    def join(self, target: Any, onclause: Any) -> "FakeQuery":
        name = _table_name(target)
        joined = [
            {**row, name: obj}
            for row in self.rows
            for obj in self.session.data[name]
            if _matches(onclause, {**row, name: obj})
        ]
        return self._with(joined)

    def filter(self, *clauses: Any) -> "FakeQuery":
        return self._with([row for row in self.rows if all(_matches(c, row) for c in clauses)])

    def order_by(self, *clauses: Any) -> "FakeQuery":
        rows = list(self.rows)
        for clause in reversed(clauses):  # stable sort, last key first
            descending = isinstance(clause, UnaryExpression) and clause.modifier is operators.desc_op
            column = clause.element if isinstance(clause, UnaryExpression) else clause
            rows.sort(key=lambda row: _value(column, row), reverse=descending)
        return self._with(rows)

    def _project(self, row: Row) -> Any:
        values = []
        for entity in self.entities:
            obj = row[_table_name(entity)]
            values.append(getattr(obj, entity.key) if isinstance(entity, InstrumentedAttribute) else obj)
        return values[0] if len(values) == 1 else tuple(values)

    def all(self) -> list[Any]:
        return [self._project(row) for row in self.rows]

    def first(self) -> Any:
        return self._project(self.rows[0]) if self.rows else None

    def count(self) -> int:
        return len(self.rows)

    def delete(self, synchronize_session: Any = None) -> int:
        for row in self.rows:
            self.session.delete(row[self.base])
        return len(self.rows)

    def update(self, values: dict[str, Any], synchronize_session: Any = None) -> int:
        for row in self.rows:
            for key, value in values.items():
                setattr(row[self.base], key, value)
        return len(self.rows)


class FakeSession:
    def __init__(self) -> None:
        self.data: dict[str, list[Any]] = defaultdict(list)
        self.commits = 0
        self.rollbacks = 0
        self.executed: list[Any] = []
        self.commit_error: Exception | None = None  # raised once by the next commit()

    def query(self, *entities: Any) -> FakeQuery:
        return FakeQuery(self, entities)

    def add(self, obj: Any) -> None:
        table = obj.__table__
        for column in table.columns:
            if getattr(obj, column.key) is None and column.default is not None:
                default = column.default
                setattr(obj, column.key, default.arg(None) if default.is_callable else default.arg)
        if "id" in table.columns and obj.id is None:
            obj.id = max((row.id for row in self.data[table.name]), default=0) + 1
        self.data[table.name].append(obj)

    def add_all(self, objs: list[Any]) -> None:
        for obj in objs:
            self.add(obj)

    def delete(self, obj: Any) -> None:
        self.data[obj.__table__.name].remove(obj)

    def commit(self) -> None:
        if self.commit_error is not None:
            error, self.commit_error = self.commit_error, None
            raise error
        self.commits += 1

    def rollback(self) -> None:
        self.rollbacks += 1

    def execute(self, statement: Any) -> None:
        self.executed.append(statement)

    def flush(self) -> None:
        pass

    def refresh(self, obj: Any) -> None:
        pass

    def close(self) -> None:
        pass

    def rows(self, model: Any) -> list[Any]:
        return list(self.data[model.__tablename__])


def add_user(db: FakeSession, username: str, password: str = "pw", **fields: Any) -> models.User:
    user = models.User(
        username=username,
        password=password,
        joined_date=datetime(2025, 1, 1, tzinfo=timezone.utc),
        **fields,
    )
    db.add(user)
    return user


def add_entry(db: FakeSession, username: str, **fields: Any) -> models.MediaEntry:
    """Seed a valid media entry; values are plain strings, as the DB returns them."""
    values: dict[str, Any] = {
        "title": "Some Game",
        "media_type": "Game",
        "status": "Playing",
        "external_id": "igdb_1",
        **fields,
    }
    entry = models.MediaEntry(username=username, **values)
    db.add(entry)
    return entry


def headers(user: str | models.User) -> dict[str, str]:
    """Bearer token header. A plain name stands for a user seeded with add_user's defaults;
    pass the User itself when it was seeded with a different password."""
    if isinstance(user, str):
        user = models.User(username=user, password="pw")
    return {"Authorization": f"Bearer {create_access_token(user)}"}
