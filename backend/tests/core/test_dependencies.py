"""get_current_user / get_current_username, exercised through a protected route."""

from datetime import datetime, timedelta, timezone

from app.core.security import TOKEN_LIFETIME, create_access_token, hash_password
from tests.fakes import add_user, headers


def get(client, request_headers):
    return client.get("/api/entries", headers=request_headers)


def test_valid_token_is_accepted(client, db):
    user = add_user(db, "alice")
    assert get(client, headers(user)).status_code == 200


def test_missing_or_malformed_token_is_unauthorized(client, db):
    add_user(db, "alice")
    response = get(client, {})
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"
    assert get(client, {"Authorization": "Bearer not-a-token"}).status_code == 401


def test_x_username_header_is_no_longer_trusted(client, db):
    add_user(db, "alice")
    assert get(client, {"X-Username": "alice"}).status_code == 401


def test_expired_token_is_unauthorized(client, db):
    user = add_user(db, "alice")
    issued = datetime.now(timezone.utc) - TOKEN_LIFETIME - timedelta(minutes=1)
    token = create_access_token(user, now=issued)
    assert get(client, {"Authorization": f"Bearer {token}"}).status_code == 401


def test_token_signed_with_another_secret_is_unauthorized(client, db, monkeypatch):
    user = add_user(db, "alice")
    monkeypatch.setenv("AUTH_SECRET", "a-completely-different-secret-of-32+-chars")
    forged = headers(user)
    monkeypatch.undo()
    assert get(client, forged).status_code == 401


def test_token_of_unknown_user_is_unauthorized(client):
    assert get(client, headers("ghost")).status_code == 401


def test_password_change_invalidates_older_tokens(client, db):
    user = add_user(db, "alice")
    old = headers(user)
    user.password_hash = hash_password("brand-new-password")
    assert get(client, old).status_code == 401
    assert get(client, headers(user)).status_code == 200


def test_missing_secret_is_a_clear_503(client, db, monkeypatch):
    user = add_user(db, "alice")
    token = headers(user)
    monkeypatch.setenv("AUTH_SECRET", "too-short")
    response = get(client, token)
    assert response.status_code == 503
    assert "AUTH_SECRET" in response.json()["detail"]
