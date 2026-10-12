from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_username
from app import models
from app.schemas.friends import FriendAddRequest, FriendResponse

router = APIRouter(prefix="/friends", tags=["friends"])


@router.get("", response_model=list[FriendResponse])
def list_friends(
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
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
        FriendResponse(username=friendship.friend_username, avatar_path=avatar_path)
        for friendship, avatar_path in rows
    ]


@router.post("", response_model=FriendResponse, status_code=status.HTTP_201_CREATED)
def add_friend(
    payload: FriendAddRequest,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
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
    return FriendResponse(username=friend.username, avatar_path=friend.avatar_path)


@router.delete("/{friend_username}", status_code=status.HTTP_204_NO_CONTENT)
def remove_friend(
    friend_username: str,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
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
