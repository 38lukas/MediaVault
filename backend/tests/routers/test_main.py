from fastapi.testclient import TestClient

from app.main import app


def test_health_is_ok_without_database():
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ping_db_runs_a_query(client, db):
    response = client.get("/ping-db")
    assert response.status_code == 200
    assert len(db.executed) == 1


def test_ping_db_reports_failure(client, db, monkeypatch):
    def broken(statement):
        raise RuntimeError("connection refused")

    monkeypatch.setattr(db, "execute", broken)
    response = client.get("/ping-db")
    assert response.status_code == 500
    assert "connection refused" in response.json()["detail"]
