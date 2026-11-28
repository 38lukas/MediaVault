"""Friends routes under /api/friends."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_username
from app import models, schemas

router = APIRouter(prefix="/friends", tags=["friends"])


@router.get("", response_model=list[schemas.FriendResponse])
def list_friends(
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Return the logged-in user's friends, sorted by username."""
    rows = (
        db.query(models.Friendship, models.User.avatar_path)
        .join(
            models.User,
            models.User.username == models.Friendship.friend_username,
        )
        .filter(models.Friendship.owner_username == username)
        .order_by(models.Friendship.friend_username.asc())
        .all()
    )
    return [
        schemas.FriendResponse(username=friendship.friend_username, avatar_path=avatar_path)
        for friendship, avatar_path in rows
    ]


@router.get("/entries", response_model=list[schemas.FriendEntryResponse])
def list_friend_entries(
    external_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Return the logged-in user's friends who logged the media with this external id."""
    rows = (
        db.query(models.MediaEntry, models.User.avatar_path)
        .join(
            models.Friendship,
            models.Friendship.friend_username == models.MediaEntry.username,
        )
        .join(models.User, models.User.username == models.MediaEntry.username)
        .filter(
            models.Friendship.owner_username == username,
            models.MediaEntry.external_id == external_id.strip(),
        )
        .order_by(models.MediaEntry.username.asc())
        .all()
    )
    return [
        schemas.FriendEntryResponse(
            username=entry.username,
            avatar_path=avatar_path,
            status=entry.status,
            rating=entry.rating or None,  # 0 = unrated
            finished_at=entry.finished_at,
        )
        for entry, avatar_path in rows
    ]


@router.post("", response_model=schemas.FriendResponse, status_code=status.HTTP_201_CREATED)
def add_friend(
    payload: schemas.FriendAddRequest,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Add an existing user to the logged-in user's friends list."""
    friend_username = payload.username.strip()
    if not friend_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is required",
        )
    if friend_username == username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot add yourself as a friend",
        )

    friend = (
        db.query(models.User).filter(models.User.username == friend_username).first()
    )
    if friend is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    existing = (
        db.query(models.Friendship)
        .filter(
            models.Friendship.owner_username == username,
            models.Friendship.friend_username == friend_username,
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already in your friends list",
        )

    friendship = models.Friendship(
        owner_username=username,
        friend_username=friend_username,
    )
    db.add(friendship)
    db.commit()
    return schemas.FriendResponse(username=friend.username, avatar_path=friend.avatar_path)


@router.delete("/{friend_username}", status_code=status.HTTP_204_NO_CONTENT)
def remove_friend(
    friend_username: str,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Remove a user from the logged-in user's friends list."""
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
            detail="Friend not found",
        )
    db.delete(friendship)
    db.commit()
    return None
