"""Read-only views of a friend's data under /api/friends/{friend_username}.

Only GET routes live here: viewing a friend can never change their data. Access needs
the friend to be in the logged-in user's friends list.
"""

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_username
from app import models, schemas
from app.routers.lists import load_lists
from app.routers.profile import build_profile_stats

router = APIRouter(prefix="/friends/{friend_username}", tags=["friend view"])


def get_viewable_friend(
    friend_username: str = Path(min_length=1),
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
) -> str:
    """The friend's username, if the logged-in user has added them; 404 otherwise."""
    friendship = (
        db.query(models.Friendship)
        .filter(
            models.Friendship.owner_username == username,
            models.Friendship.friend_username == friend_username,
        )
        .first()
    )
    if friendship is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="That user is not in your friends list",
        )
    return friend_username


@router.get("/settings", response_model=schemas.UserSettingsResponse)
def get_friend_settings(
    friend: str = Depends(get_viewable_friend),
    db: Session = Depends(get_db),
):
    """Return the friend's display settings (avatar, joined date, library defaults)."""
    user = db.query(models.User).filter(models.User.username == friend).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/entries", response_model=list[schemas.MediaEntryResponse])
def get_friend_entries(
    friend: str = Depends(get_viewable_friend),
    db: Session = Depends(get_db),
):
    """Return the friend's library entries."""
    return db.query(models.MediaEntry).filter(models.MediaEntry.username == friend).all()


@router.get("/lists", response_model=list[schemas.MediaListResponse])
def get_friend_lists(
    friend: str = Depends(get_viewable_friend),
    db: Session = Depends(get_db),
):
    """Return the friend's lists, oldest first."""
    return load_lists(db, friend)


@router.get("/profile/stats", response_model=schemas.ProfileStatsResponse)
def get_friend_profile_stats(
    friend: str = Depends(get_viewable_friend),
    db: Session = Depends(get_db),
):
    """Return the friend's profile stats, respecting the sections they chose to hide."""
    return build_profile_stats(db, friend)
