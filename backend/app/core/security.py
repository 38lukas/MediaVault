"""Password hashing with bcrypt."""

import hmac

import bcrypt

from app import models

# bcrypt only looks at the first 72 bytes; longer passwords are rejected, not truncated.
MAX_PASSWORD_BYTES = 72
MIN_PASSWORD_LENGTH = 8
BCRYPT_ROUNDS = 12  # Work factor; tests lower it to keep the suite fast.


def hash_password(password: str) -> str:
    """Return a salted bcrypt hash for a password.

    @param password: Plain-text password, at most 72 bytes in UTF-8.
    @returns The hash as a string, e.g. "$2b$12$...".
    """
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    """Check a password against a stored bcrypt hash; False for any malformed input."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except ValueError:
        return False


_DUMMY_HASH: str | None = None


def burn_password_check(password: str) -> None:
    """Spend the same bcrypt time as a real check, so unknown usernames aren't faster."""
    global _DUMMY_HASH
    if _DUMMY_HASH is None:
        _DUMMY_HASH = hash_password("dummy-password")
    verify_password(password, _DUMMY_HASH)


def check_user_password(user: models.User, password: str) -> bool:
    """Check a login password; upgrades a legacy plain-text user to a hash on success.

    The plain-text column is left untouched (it is cleared in a later, separate step).
    The caller commits, so an upgraded hash is saved together with the request.
    """
    if user.password_hash:
        return verify_password(password, user.password_hash)
    if user.password is None:
        return False
    if not hmac.compare_digest(user.password.encode("utf-8"), password.encode("utf-8")):
        return False
    if len(password.encode("utf-8")) <= MAX_PASSWORD_BYTES:
        user.password_hash = hash_password(password)
    return True


def password_problem(password: str) -> str | None:
    """Reason a new password is not acceptable, or None if it is fine."""
    if len(password) < MIN_PASSWORD_LENGTH:
        return f"Password must be at least {MIN_PASSWORD_LENGTH} characters"
    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        return f"Password must be at most {MAX_PASSWORD_BYTES} bytes"
    return None
