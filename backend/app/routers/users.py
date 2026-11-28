"""Current-user settings and account routes under /api/users/me."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_username
from app.core.security import check_user_password, create_access_token, hash_password, password_problem
from app import models, schemas
from app.services.avatars import save_avatar

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


@router.post("/avatar", response_model=schemas.UserSettingsResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Upload an avatar for the logged-in user and persist its public URL."""
    user = db.query(models.User).filter(models.User.username == username).first()
    user.avatar_path = await save_avatar(
        username,
        file,
        user.avatar_path,
    )
    db.commit()
    db.refresh(user)
    return user


@router.patch("/account", response_model=schemas.AccountUpdateResponse)
def update_account(
    payload: schemas.UserAccountUpdate,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Change the username and/or password; password changes require the current password.

    Returns a fresh token, since both changes invalidate the old one.
    """
    user = db.query(models.User).filter(models.User.username == username).first()

    # Password changes must be confirmed with the current password.
    if payload.new_password:
        if not payload.current_password or not check_user_password(user, payload.current_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect",
            )
        problem = password_problem(payload.new_password)
        if problem:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=problem)
        user.password_hash = hash_password(payload.new_password)
        user.password = None  # The user replaced it; no plain-text copy of the new one.

    # Validates if the new username is already taken
    new_username = payload.new_username.strip() if payload.new_username else ""
    if new_username and new_username != username:
        taken = db.query(models.User).filter(models.User.username == new_username).first()
        if taken is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username is already taken",
            )

        user.username = new_username  # Media entries will be updated via ON UPDATE CASCADE
        # Avatar stays on the same S3 object URL (keys are unique; no rename needed).

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken",
        )

    settings = schemas.UserSettingsResponse.model_validate(user)
    return schemas.AccountUpdateResponse(
        **settings.model_dump(),
        access_token=create_access_token(user),
    )
