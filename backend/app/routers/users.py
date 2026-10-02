"""Current-user settings and account routes under /api/users/me."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_username
from app import models, schemas

router = APIRouter(prefix="/users/me", tags=["users"])


@router.get("", response_model=schemas.UserSettingsResponse)
def get_user_settings(
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Return account info and general settings of the logged-in user."""
    return db.query(models.User).filter(models.User.username == username).first()


@router.patch("/settings", response_model=schemas.UserSettingsResponse)
def update_user_settings(
    payload: schemas.UserSettingsUpdate,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Apply a partial update to the general settings of the logged-in user."""
    user = db.query(models.User).filter(models.User.username == username).first()

    # Apply the partial update to the user settings
    for field, value in payload.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.patch("/account", response_model=schemas.UserSettingsResponse)
def update_account(
    payload: schemas.UserAccountUpdate,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Change the username and/or password; password changes require the current password."""
    user = db.query(models.User).filter(models.User.username == username).first()

    # Password changes must be confirmed with the current password.
    if payload.new_password:
        if not payload.current_password or user.password != payload.current_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect",
            )
        user.password = payload.new_password

    # Validates if the new username is already taken
    new_username = payload.new_username.strip() if payload.new_username else ""
    if new_username and new_username != username:
        taken = db.query(models.User).filter(models.User.username == new_username).first()
        if taken is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username is already taken",
            )
        
        user.username = new_username # Media entries will be updated via ON UPDATE CASCADE

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken",
        )

    return user