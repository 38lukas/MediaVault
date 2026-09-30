"""Shared FastAPI dependencies."""

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models


def get_current_username(
    x_username: str = Header(..., alias="X-Username"),
    db: Session = Depends(get_db),
) -> str:
    """Resolves the logged-in username from the X-Username header."""
    username = x_username.strip()
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing username",
        )

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unknown user",
        )
    return username
