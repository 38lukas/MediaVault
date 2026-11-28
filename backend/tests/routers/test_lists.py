from app import models
from tests.fakes import add_entry, add_user, headers

ALICE = headers("alice")


def setup(db):
    add_user(db, "alice")
    add_user(db, "bob")


def make_list(db, username="alice", name="Faves"):
    row = models.MediaList(username=username, name=name)
    db.add(row)
    return row


def add_items(client, list_id, entries):
    for entry in entries:
        response = client.post(f"/api/lists/{list_id}/items", json={"entry_id": entry.id}, headers=ALICE)
        assert response.status_code == 201
    return response.json()


def titles(body):
    return [item["entry"]["title"] for item in body["items"]]


def test_create_and_list_only_own_lists(client, db):
    setup(db)
    make_list(db, "bob", "Bob's")
    response = client.post("/api/lists", json={"name": " Top ", "description": " best "}, headers=ALICE)
    assert response.status_code == 201
    assert response.json() == {
        "id": 2, "username": "alice", "name": "Top", "description": "best", "items": [],
    }
    assert [row["name"] for row in client.get("/api/lists", headers=ALICE).json()] == ["Top"]


def test_cannot_touch_someone_elses_list(client, db):
    setup(db)
    other = make_list(db, "bob")
    entry = add_entry(db, "alice")
    assert client.put(f"/api/lists/{other.id}", json={"name": "Mine"}, headers=ALICE).status_code == 404
    assert client.delete(f"/api/lists/{other.id}", headers=ALICE).status_code == 404
    response = client.post(f"/api/lists/{other.id}/items", json={"entry_id": entry.id}, headers=ALICE)
    assert response.status_code == 404
    assert other.name == "Faves"


def test_update_list(client, db):
    setup(db)
    row = make_list(db)
    response = client.put(f"/api/lists/{row.id}", json={"name": "Renamed", "description": ""}, headers=ALICE)
    assert response.status_code == 200
    assert (row.name, row.description) == ("Renamed", None)


def test_items_are_appended_in_order(client, db):
    setup(db)
    row = make_list(db)
    body = add_items(client, row.id, [add_entry(db, "alice", title=t) for t in ("A", "B", "C")])
    assert titles(body) == ["A", "B", "C"]
    assert [item["position"] for item in body["items"]] == [0, 1, 2]


def test_cannot_add_entry_from_another_library_or_twice(client, db):
    setup(db)
    row = make_list(db)
    bobs = add_entry(db, "bob")
    mine = add_entry(db, "alice")
    add_items(client, row.id, [mine])
    assert client.post(f"/api/lists/{row.id}/items", json={"entry_id": bobs.id}, headers=ALICE).status_code == 404
    assert client.post(f"/api/lists/{row.id}/items", json={"entry_id": mine.id}, headers=ALICE).status_code == 409
    assert len(db.rows(models.MediaListItem)) == 1


def test_remove_item_closes_the_gap(client, db):
    setup(db)
    row = make_list(db)
    body = add_items(client, row.id, [add_entry(db, "alice", title=t) for t in ("A", "B", "C")])
    middle = body["items"][1]["id"]
    response = client.delete(f"/api/lists/{row.id}/items/{middle}", headers=ALICE)
    assert response.status_code == 200
    assert titles(response.json()) == ["A", "C"]
    assert [item["position"] for item in response.json()["items"]] == [0, 1]
    assert client.delete(f"/api/lists/{row.id}/items/{middle}", headers=ALICE).status_code == 404


def test_reorder(client, db):
    setup(db)
    row = make_list(db)
    body = add_items(client, row.id, [add_entry(db, "alice", title=t) for t in ("A", "B", "C")])
    a, b, c = (item["id"] for item in body["items"])
    response = client.put(f"/api/lists/{row.id}/order", json={"item_ids": [c, a, b]}, headers=ALICE)
    assert titles(response.json()) == ["C", "A", "B"]


def test_reorder_must_name_every_item_once(client, db):
    setup(db)
    row = make_list(db)
    body = add_items(client, row.id, [add_entry(db, "alice", title=t) for t in ("A", "B")])
    a, b = (item["id"] for item in body["items"])
    for bad in ([a], [a, a], [a, b, 999]):
        response = client.put(f"/api/lists/{row.id}/order", json={"item_ids": bad}, headers=ALICE)
        assert response.status_code == 400


def test_delete_list_keeps_library_entries(client, db):
    setup(db)
    row = make_list(db)
    keep = make_list(db, name="Other")
    entry = add_entry(db, "alice")
    add_items(client, row.id, [entry])
    add_items(client, keep.id, [entry])
    assert client.delete(f"/api/lists/{row.id}", headers=ALICE).status_code == 204
    assert db.rows(models.MediaList) == [keep]
    assert [item.list_id for item in db.rows(models.MediaListItem)] == [keep.id]
    assert db.rows(models.MediaEntry) == [entry]
