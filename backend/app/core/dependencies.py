"""Shared FastAPI dependencies."""

import hmac

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import password_stamp, read_access_token
from app import models

_bearer = HTTPBearer(auto_error=False)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> models.User:
    """Resolves the logged-in user from the `Authorization: Bearer <token>` header."""
    if credentials is None:
        raise _unauthorized("Not logged in")

    payload = read_access_token(credentials.credentials)
    if payload is None:
        raise _unauthorized("Your session has expired. Please log in again.")

    user = db.query(models.User).filter(models.User.username == payload["sub"]).first()
    # A renamed or deleted user, or a changed password, makes older tokens invalid.
    if user is None or not hmac.compare_digest(str(payload.get("pwd", "")), password_stamp(user)):
        raise _unauthorized("Your session has expired. Please log in again.")
    return user


def get_current_username(user: models.User = Depends(get_current_user)) -> str:
    """Username of the logged-in user; every router filters its queries by this."""
    return user.username
