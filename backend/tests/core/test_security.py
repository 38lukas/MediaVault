from app import models
from app.core.security import check_user_password, hash_password, password_problem, verify_password


def test_hash_roundtrip_and_salting():
    first, second = hash_password("correct horse"), hash_password("correct horse")
    assert first != second  # salted
    assert first.startswith("$2b$")
    assert verify_password("correct horse", first)
    assert not verify_password("wrong horse", first)


def test_verify_never_raises_on_bad_input():
    assert not verify_password("secret", "not-a-bcrypt-hash")
    assert not verify_password("x" * 100, hash_password("secret"))  # over bcrypt's 72 bytes


def test_password_rules():
    assert password_problem("short") == "Password must be at least 8 characters"
    assert "72 bytes" in password_problem("ä" * 40)  # 80 bytes in UTF-8
    assert password_problem("long enough") is None


def test_hashed_user():
    user = models.User(username="a", password=None, password_hash=hash_password("secret123"))
    assert check_user_password(user, "secret123")
    assert not check_user_password(user, "secret124")


def test_legacy_user_is_upgraded_and_plain_text_kept():
    user = models.User(username="a", password="legacy-pw", password_hash=None)
    assert not check_user_password(user, "wrong")
    assert user.password_hash is None
    assert check_user_password(user, "legacy-pw")
    assert verify_password("legacy-pw", user.password_hash)
    assert user.password == "legacy-pw"  # cleared only in a later, separate step


def test_legacy_password_too_long_for_bcrypt_still_logs_in():
    user = models.User(username="a", password="p" * 80, password_hash=None)
    assert check_user_password(user, "p" * 80)
    assert user.password_hash is None


def test_user_without_any_password_cannot_log_in():
    assert not check_user_password(models.User(username="a", password=None, password_hash=None), "")
