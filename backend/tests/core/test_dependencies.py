"""get_current_username, exercised through a protected route."""

from tests.fakes import add_user, headers


def test_missing_header_is_rejected(client):
    assert client.get("/api/entries").status_code == 422


def test_blank_username_is_unauthorized(client):
    response = client.get("/api/entries", headers=headers("   "))
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing username"


def test_unknown_user_is_unauthorized(client):
    response = client.get("/api/entries", headers=headers("ghost"))
    assert response.status_code == 401
    assert response.json()["detail"] == "Unknown user"


def test_known_user_is_accepted_and_trimmed(client, db):
    add_user(db, "alice")
    assert client.get("/api/entries", headers=headers("  alice ")).status_code == 200
