from app import models
from tests.fakes import add_user


def login(client, username, password):
    return client.post("/api/auth/login", json={"username": username, "password": password})


def test_new_username_creates_an_account(client, db):
    response = login(client, "  newbie ", "secret")
    assert response.status_code == 200
    assert response.json()["username"] == "newbie"
    assert [u.username for u in db.rows(models.User)] == ["newbie"]


def test_existing_user_with_right_password(client, db):
    add_user(db, "alice", password="secret")
    response = login(client, "alice", "secret")
    assert response.status_code == 200
    assert "password" not in response.json()


def test_wrong_password_is_rejected(client, db):
    add_user(db, "alice", password="secret")
    response = login(client, "alice", "nope")
    assert response.status_code == 401
    assert len(db.rows(models.User)) == 1


def test_blank_credentials_are_rejected(client, db):
    assert login(client, "   ", "secret").status_code == 400
    assert login(client, "alice", "").status_code == 400
    assert db.rows(models.User) == []
