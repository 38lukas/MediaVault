from app import models
from app.core.security import hash_password, verify_password
from tests.fakes import add_user


def post(client, path, username, password):
    return client.post(f"/api/auth/{path}", json={"username": username, "password": password})


# --- register ---------------------------------------------------------------------


def test_register_creates_hashed_account(client, db):
    response = post(client, "register", "  newbie ", "secret123")
    assert response.status_code == 201
    assert response.json()["username"] == "newbie"
    assert "password" not in response.json() and "password_hash" not in response.json()
    (user,) = db.rows(models.User)
    assert user.password is None
    assert verify_password("secret123", user.password_hash)


def test_register_taken_username(client, db):
    add_user(db, "alice")
    assert post(client, "register", "alice", "secret123").status_code == 409
    assert len(db.rows(models.User)) == 1


def test_register_rejects_weak_or_blank_input(client, db):
    assert post(client, "register", "bob", "short").json()["detail"] == "Password must be at least 8 characters"
    assert post(client, "register", "   ", "secret123").status_code == 400
    assert db.rows(models.User) == []


# --- login ------------------------------------------------------------------------


def test_login_never_creates_accounts(client, db):
    response = post(client, "login", "typo", "secret123")
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"
    assert db.rows(models.User) == []


def test_login_with_hashed_password(client, db):
    add_user(db, "alice", password=None, password_hash=hash_password("secret123"))
    response = post(client, "login", "alice", "secret123")
    assert response.status_code == 200
    assert "password" not in response.json()
    assert post(client, "login", "alice", "nope").status_code == 401


def test_login_upgrades_legacy_plain_text_password(client, db):
    user = add_user(db, "alice", password="old-plain")
    assert post(client, "login", "alice", "old-plain").status_code == 200
    assert verify_password("old-plain", user.password_hash)
    assert db.commits == 1


def test_wrong_password_and_unknown_user_look_the_same(client, db):
    add_user(db, "alice", password="secret")
    wrong = post(client, "login", "alice", "nope")
    unknown = post(client, "login", "ghost", "nope")
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()


def test_login_blank_credentials(client):
    assert post(client, "login", "   ", "secret").status_code == 400
    assert post(client, "login", "alice", "").status_code == 400
