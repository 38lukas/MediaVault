"""Auth routes under /api/auth."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    burn_password_check,
    check_user_password,
    create_access_token,
    hash_password,
    password_problem,
)
from app import models, schemas

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_response(user: models.User) -> schemas.TokenResponse:
    return schemas.TokenResponse(
        username=user.username,
        joined_date=user.joined_date,
        access_token=create_access_token(user),
    )


def _clean_credentials(credentials: schemas.LoginRequest) -> tuple[str, str]:
    """Trimmed username and raw password; 400 when either is empty."""
    username = credentials.username.strip()
    if not username or not credentials.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required",
        )
    return username, credentials.password


@router.post("/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register(credentials: schemas.RegisterRequest, db: Session = Depends(get_db)):
    """Create a new account with a hashed password and log it in."""
    username, password = _clean_credentials(credentials)

    problem = password_problem(password)
    if problem:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=problem)

    taken = db.query(models.User).filter(models.User.username == username).first()
    if taken is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already taken")

    user = models.User(
        username=username,
        password=None,
        password_hash=hash_password(password),
        joined_date=datetime.now(timezone.utc),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already taken")
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Log in with username/password and get a bearer token. Unknown usernames are rejected."""
    username, password = _clean_credentials(credentials)

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        burn_password_check(password)
    # Same message for unknown user and wrong password, so logins don't reveal usernames.
    if user is None or not check_user_password(user, password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    db.commit()  # Saves the hash if a legacy plain-text password was just upgraded.
    return _token_response(user)
