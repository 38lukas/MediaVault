from sqlalchemy.exc import IntegrityError

from app.core.security import hash_password, verify_password
from app.routers import users as users_router
from tests.fakes import add_user, headers

ALICE = headers("alice")


def test_get_settings_returns_defaults(client, db):
    add_user(db, "alice")
    body = client.get("/api/users/me", headers=ALICE).json()
    assert body["username"] == "alice"
    assert (body["default_sort_field"], body["default_card_size"], body["default_type_filter"]) == ("status", 2, "All")
    assert "password" not in body


def test_partial_settings_update(client, db):
    user = add_user(db, "alice", default_card_size=3)
    response = client.patch(
        "/api/users/me/settings",
        json={"default_sort_field": "rating", "library_loaded_statuses": []},
        headers=ALICE,
    )
    assert response.status_code == 200
    assert user.default_sort_field == "rating"
    assert user.default_card_size == 3  # untouched
    assert user.library_loaded_statuses == []


def test_invalid_setting_is_rejected(client, db):
    user = add_user(db, "alice")
    response = client.patch("/api/users/me/settings", json={"default_type_filter": "DLC"}, headers=ALICE)
    assert response.status_code == 422
    assert user.default_type_filter == "All"


def change_password(client, user, current, new):
    return client.patch(
        "/api/users/me/account",
        json={"current_password": current, "new_password": new},
        headers=headers(user),
    )


def test_password_change_needs_current_password(client, db):
    user = add_user(db, "alice", password=None, password_hash=hash_password("old-password"))
    old_hash = user.password_hash
    for current in (None, "wrong"):
        assert change_password(client, user, current, "new-password").status_code == 401
    assert user.password_hash == old_hash
    assert change_password(client, user, "old-password", "new-password").status_code == 200
    assert verify_password("new-password", user.password_hash)


def test_password_change_from_legacy_plain_text_clears_it(client, db):
    user = add_user(db, "alice", password="legacy")
    assert change_password(client, user, "legacy", "new-password").status_code == 200
    assert user.password is None
    assert verify_password("new-password", user.password_hash)


def test_new_password_must_follow_rules(client, db):
    user = add_user(db, "alice", password="legacy")
    response = change_password(client, user, "legacy", "short")
    assert response.status_code == 400
    assert user.password == "legacy"


def test_rename_returns_a_token_for_the_new_name(client, db):
    user = add_user(db, "alice")
    response = client.patch("/api/users/me/account", json={"new_username": " alicia "}, headers=ALICE)
    assert response.status_code == 200
    assert response.json()["username"] == "alicia"
    assert user.username == "alicia"
    new_token = {"Authorization": f"Bearer {response.json()['access_token']}"}
    assert client.get("/api/users/me", headers=new_token).json()["username"] == "alicia"
    assert client.get("/api/users/me", headers=ALICE).status_code == 401  # old name


def test_password_change_logs_out_other_tokens(client, db):
    user = add_user(db, "alice", password="legacy-pw")
    old = headers(user)
    response = change_password(client, user, "legacy-pw", "new-password")
    new_token = {"Authorization": f"Bearer {response.json()['access_token']}"}
    assert client.get("/api/users/me", headers=old).status_code == 401
    assert client.get("/api/users/me", headers=new_token).status_code == 200


def test_rename_to_taken_name_conflicts(client, db):
    user = add_user(db, "alice")
    add_user(db, "bob")
    response = client.patch("/api/users/me/account", json={"new_username": "bob"}, headers=ALICE)
    assert response.status_code == 409
    assert user.username == "alice"


def test_integrity_error_on_rename_becomes_conflict(client, db):
    add_user(db, "alice")
    db.commit_error = IntegrityError("UPDATE", {}, Exception("unique violation"))
    response = client.patch("/api/users/me/account", json={"new_username": "racer"}, headers=ALICE)
    assert response.status_code == 409
    assert db.rollbacks == 1


def test_avatar_upload_stores_returned_url(client, db, monkeypatch):
    user = add_user(db, "alice", avatar_path="https://cdn/avatars/old.png")
    calls = []

    async def fake_save_avatar(username, upload, previous_path):
        calls.append((username, upload.filename, previous_path))
        return "https://cdn/avatars/new.png"

    monkeypatch.setattr(users_router, "save_avatar", fake_save_avatar)
    response = client.post(
        "/api/users/me/avatar", files={"file": ("me.png", b"\x89PNG", "image/png")}, headers=ALICE
    )
    assert response.status_code == 200
    assert response.json()["avatar_path"] == "https://cdn/avatars/new.png"
    assert user.avatar_path == "https://cdn/avatars/new.png"
    assert calls == [("alice", "me.png", "https://cdn/avatars/old.png")]
