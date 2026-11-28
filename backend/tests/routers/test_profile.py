from datetime import date, datetime, timezone

from sqlalchemy.exc import IntegrityError

from app import models
from tests.fakes import add_entry, add_user, headers

ALICE = headers("alice")
THIS_YEAR = datetime.now(timezone.utc).year


# --- /profile/stats ---------------------------------------------------------------


def test_stats_only_use_own_entries(client, db):
    add_user(db, "alice", profile_hidden_sections=["achievements"])
    add_user(db, "bob")
    add_entry(db, "alice", status="Finished", rating=8,
              finished_at=datetime(THIS_YEAR, 1, 2, tzinfo=timezone.utc))
    add_entry(db, "alice", title="Up", media_type="Movie", status="Watchlist")
    add_entry(db, "bob", status="Finished", rating=3)
    body = client.get("/api/profile/stats", headers=ALICE).json()
    assert body["finished"]["total"] == 1
    assert body["finished_this_year"]["game"] == 1
    assert body["finished_year"] == THIS_YEAR
    assert {b["rating"]: b["count"] for b in body["rating_distribution"]}[8] == 1
    assert sum(b["count"] for b in body["rating_distribution"]) == 1
    assert body["unrated_count"] == 1
    assert body["hidden_sections"] == ["achievements"]
    assert [g["category"] for g in body["favorites"]] == ["All", "Game", "Movie", "Series", "Anime", "Book"]


def test_stored_zero_rating_counts_as_unrated(client, db):
    add_user(db, "alice")
    add_entry(db, "alice", rating=0)
    add_entry(db, "alice", rating=6)
    body = client.get("/api/profile/stats", headers=ALICE).json()
    assert body["unrated_count"] == 1
    assert sum(b["count"] for b in body["rating_distribution"]) == 1


def test_recent_activity_newest_first_capped_at_8(client, db):
    add_user(db, "alice")
    for day in range(1, 11):
        add_entry(db, "alice", title=f"Day {day}", played_dates=[date(2025, 1, day)])
    add_entry(db, "alice", title="No dates")
    body = client.get("/api/profile/stats", headers=ALICE).json()
    assert [e["title"] for e in body["recent_activity"]] == [f"Day {d}" for d in range(10, 2, -1)]


# --- /profile/favorites/{slot} ------------------------------------------------------

PICK = {"category": "Movie", "title": "Up", "media_type": "Movie", "external_id": "tmdb_movie_14160"}


def slots(body, category):
    return next(group["slots"] for group in body if group["category"] == category)


def test_set_and_clear_a_favorite(client, db):
    add_user(db, "alice")
    body = client.put("/api/profile/favorites/2", json=PICK, headers=ALICE).json()
    assert slots(body, "Movie")[2]["title"] == "Up"
    assert slots(body, "All")[2]["title"] is None
    body = client.put("/api/profile/favorites/2", json={"category": "Movie"}, headers=ALICE).json()
    assert slots(body, "Movie")[2]["title"] is None
    assert db.rows(models.ProfileFavorite) == []


def test_same_title_twice_in_one_list_conflicts(client, db):
    add_user(db, "alice")
    client.put("/api/profile/favorites/0", json=PICK, headers=ALICE)
    response = client.put("/api/profile/favorites/1", json=PICK, headers=ALICE)
    assert response.status_code == 409
    assert client.put("/api/profile/favorites/1", json={**PICK, "category": "All"}, headers=ALICE).status_code == 200


def test_number_one_moves_between_slots(client, db):
    add_user(db, "alice")
    client.put("/api/profile/favorites/0", json={**PICK, "is_number_one": True}, headers=ALICE)
    body = client.put(
        "/api/profile/favorites/1",
        json={**PICK, "external_id": "tmdb_movie_2", "title": "Two", "is_number_one": True},
        headers=ALICE,
    ).json()
    assert [s["is_number_one"] for s in slots(body, "Movie")[:2]] == [False, True]


def test_favorites_are_per_user(client, db):
    add_user(db, "alice")
    add_user(db, "bob")
    client.put("/api/profile/favorites/0", json=PICK, headers=headers("bob"))
    body = client.put("/api/profile/favorites/0", json={"category": "Movie"}, headers=ALICE).json()
    assert slots(body, "Movie")[0]["title"] is None
    assert [f.username for f in db.rows(models.ProfileFavorite)] == ["bob"]


def test_slot_out_of_range(client, db):
    add_user(db, "alice")
    assert client.put("/api/profile/favorites/5", json=PICK, headers=ALICE).status_code == 422


def test_integrity_error_becomes_conflict(client, db):
    add_user(db, "alice")
    db.commit_error = IntegrityError("INSERT", {}, Exception("unique violation"))
    response = client.put("/api/profile/favorites/0", json=PICK, headers=ALICE)
    assert response.status_code == 409
    assert db.rollbacks == 1
