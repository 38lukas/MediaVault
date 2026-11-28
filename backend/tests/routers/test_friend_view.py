import pytest

from app import models
from tests.fakes import add_entry, add_user, headers

ALICE = headers("alice")
READ_PATHS = ["settings", "entries", "lists", "profile/stats"]


def setup(db):
    add_user(db, "alice")
    add_user(db, "bob", avatar_path="https://cdn/bob.png")
    add_user(db, "carol")
    db.add(models.Friendship(owner_username="alice", friend_username="bob"))
    db.add(models.Friendship(owner_username="carol", friend_username="alice"))  # carol added alice
    add_entry(db, "bob", title="Bob's game")
    add_entry(db, "alice", title="Alice's game")
    db.add(models.MediaList(username="bob", name="Bob's list"))


def test_friend_data_is_readable(client, db):
    setup(db)
    assert client.get("/api/friends/bob/settings", headers=ALICE).json()["avatar_path"] == "https://cdn/bob.png"
    assert [e["title"] for e in client.get("/api/friends/bob/entries", headers=ALICE).json()] == ["Bob's game"]
    assert [row["name"] for row in client.get("/api/friends/bob/lists", headers=ALICE).json()] == ["Bob's list"]
    assert client.get("/api/friends/bob/profile/stats", headers=ALICE).json()["unrated_count"] == 1


@pytest.mark.parametrize("path", READ_PATHS)
def test_strangers_are_not_viewable(client, db, path):
    setup(db)
    # alice never added carol (carol only added alice), and nobody added "ghost".
    for name in ("carol", "ghost"):
        response = client.get(f"/api/friends/{name}/{path}", headers=ALICE)
        assert response.status_code == 404
        assert response.json()["detail"] == "That user is not in your friends list"


@pytest.mark.parametrize("path", READ_PATHS)
def test_needs_login(client, db, path):
    setup(db)
    assert client.get(f"/api/friends/bob/{path}").status_code == 401


def test_friend_view_is_read_only(client, db):
    setup(db)
    assert client.post("/api/friends/bob/entries", json={}, headers=ALICE).status_code == 405
    assert client.delete("/api/friends/bob/lists", headers=ALICE).status_code == 405


def test_hidden_sections_are_reported_to_friends(client, db):
    setup(db)
    db.rows(models.User)[1].profile_hidden_sections = ["achievements"]
    body = client.get("/api/friends/bob/profile/stats", headers=ALICE).json()
    assert body["hidden_sections"] == ["achievements"]
