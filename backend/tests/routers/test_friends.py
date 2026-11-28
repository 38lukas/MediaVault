from app import models
from tests.fakes import add_entry, add_user, headers


def befriend(db, owner, friend):
    db.add(models.Friendship(owner_username=owner, friend_username=friend))


def test_list_friends_sorted_with_avatars(client, db):
    add_user(db, "alice")
    add_user(db, "zoe", avatar_path="https://cdn/zoe.png")
    add_user(db, "bob")
    befriend(db, "alice", "zoe")
    befriend(db, "alice", "bob")
    befriend(db, "bob", "alice")  # bob's list, not alice's
    response = client.get("/api/friends", headers=headers("alice"))
    assert response.json() == [
        {"username": "bob", "avatar_path": None},
        {"username": "zoe", "avatar_path": "https://cdn/zoe.png"},
    ]


def test_add_friend(client, db):
    add_user(db, "alice")
    add_user(db, "bob")
    response = client.post("/api/friends", json={"username": " bob "}, headers=headers("alice"))
    assert response.status_code == 201
    assert response.json()["username"] == "bob"
    friendship = db.rows(models.Friendship)[0]
    assert (friendship.owner_username, friendship.friend_username) == ("alice", "bob")


def test_add_friend_errors(client, db):
    add_user(db, "alice")
    add_user(db, "bob")
    befriend(db, "alice", "bob")
    add = lambda name: client.post("/api/friends", json={"username": name}, headers=headers("alice"))  # noqa: E731
    assert add("alice").status_code == 400
    assert add("ghost").status_code == 404
    assert add("bob").json()["detail"] == "Already in your friends list"
    assert add("   ").status_code == 400
    assert len(db.rows(models.Friendship)) == 1


def test_remove_friend_only_from_own_list(client, db):
    add_user(db, "alice")
    add_user(db, "bob")
    befriend(db, "bob", "alice")
    assert client.delete("/api/friends/alice", headers=headers("alice")).status_code == 404
    befriend(db, "alice", "bob")
    assert client.delete("/api/friends/bob", headers=headers("alice")).status_code == 204
    assert [f.owner_username for f in db.rows(models.Friendship)] == ["bob"]


def test_friend_entries_only_include_friends(client, db):
    add_user(db, "alice")
    add_user(db, "bob")
    add_user(db, "carol")
    befriend(db, "alice", "bob")
    add_entry(db, "bob", external_id="igdb_7", status="Finished", rating=8)
    add_entry(db, "carol", external_id="igdb_7")  # not a friend
    add_entry(db, "bob", external_id="igdb_8")  # other media
    response = client.get("/api/friends/entries", params={"external_id": " igdb_7 "}, headers=headers("alice"))
    assert response.status_code == 200
    assert response.json() == [
        {"username": "bob", "avatar_path": None, "status": "Finished", "rating": 8, "finished_at": None}
    ]
