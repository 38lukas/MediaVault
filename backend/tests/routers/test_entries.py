from app import models
from tests.fakes import add_entry, add_user, headers

NEW_ENTRY = {
    "title": "Hades",
    "media_type": "Game",
    "status": "Finished",
    "external_id": "igdb_113112",
    "rating": 9,
    "finished_at": "2025-04-02T00:00:00Z",
}


def setup_users(db):
    add_user(db, "alice")
    add_user(db, "bob")


def test_list_returns_only_own_entries(client, db):
    setup_users(db)
    add_entry(db, "alice", title="Mine")
    add_entry(db, "bob", title="Not mine")
    response = client.get("/api/entries", headers=headers("alice"))
    assert response.status_code == 200
    assert [e["title"] for e in response.json()] == ["Mine"]


def test_create_assigns_current_user(client, db):
    setup_users(db)
    response = client.post("/api/entries", json={**NEW_ENTRY, "username": "bob"}, headers=headers("alice"))
    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "alice"
    assert body["played_dates"] == ["2025-04-02"]  # finish day joins the journal
    assert db.rows(models.MediaEntry)[0].username == "alice"


def test_create_rejects_invalid_status(client, db):
    setup_users(db)
    response = client.post("/api/entries", json={**NEW_ENTRY, "status": "Watched"}, headers=headers("alice"))
    assert response.status_code == 422
    assert db.rows(models.MediaEntry) == []


def test_update_own_entry(client, db):
    setup_users(db)
    entry = add_entry(db, "alice")
    response = client.put(f"/api/entries/{entry.id}", json=NEW_ENTRY, headers=headers("alice"))
    assert response.status_code == 200
    assert entry.title == "Hades"
    assert entry.rating == 9


def test_cannot_update_someone_elses_entry(client, db):
    setup_users(db)
    entry = add_entry(db, "bob", title="Bob's")
    response = client.put(f"/api/entries/{entry.id}", json=NEW_ENTRY, headers=headers("alice"))
    assert response.status_code == 404
    assert entry.title == "Bob's"


def test_delete_own_entry(client, db):
    setup_users(db)
    entry = add_entry(db, "alice")
    assert client.delete(f"/api/entries/{entry.id}", headers=headers("alice")).status_code == 204
    assert db.rows(models.MediaEntry) == []


def test_cannot_delete_someone_elses_entry(client, db):
    setup_users(db)
    entry = add_entry(db, "bob")
    assert client.delete(f"/api/entries/{entry.id}", headers=headers("alice")).status_code == 404
    assert db.rows(models.MediaEntry) == [entry]
