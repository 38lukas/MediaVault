"""Media list routes under /api."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_username
from app import models, schemas

router = APIRouter(prefix="/lists", tags=["lists"])


def _owned_list(db: Session, list_id: int, username: str) -> models.MediaList:
    row = (
        db.query(models.MediaList)
        .filter(models.MediaList.id == list_id, models.MediaList.username == username)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    return row


def _load_lists(db: Session, username: str) -> list[schemas.MediaListResponse]:
    """Return every list for a user, with items in position order."""
    lists = (
        db.query(models.MediaList)
        .filter(models.MediaList.username == username)
        .order_by(models.MediaList.id.asc())
        .all()
    )
    if not lists:
        return []

    list_ids = [row.id for row in lists]
    items = (
        db.query(models.MediaListItem)
        .filter(models.MediaListItem.list_id.in_(list_ids))
        .order_by(models.MediaListItem.position.asc(), models.MediaListItem.id.asc())
        .all()
    )
    entry_ids = {item.entry_id for item in items}
    entries = (
        db.query(models.MediaEntry).filter(models.MediaEntry.id.in_(entry_ids)).all()
        if entry_ids
        else []
    )
    entries_by_id = {entry.id: entry for entry in entries}
    items_by_list: dict[int, list[schemas.MediaListItemResponse]] = {
        list_id: [] for list_id in list_ids
    }
    for item in items:
        entry = entries_by_id.get(item.entry_id)
        if entry is None:
            continue
        items_by_list[item.list_id].append(
            schemas.MediaListItemResponse(
                id=item.id,
                position=item.position,
                entry=schemas.MediaEntryResponse.model_validate(entry),
            )
        )

    return [
        schemas.MediaListResponse(
            id=row.id,
            username=row.username,
            name=row.name,
            description=row.description,
            items=items_by_list[row.id],
        )
        for row in lists
    ]


def _load_list(db: Session, username: str, list_id: int) -> schemas.MediaListResponse:
    for row in _load_lists(db, username):
        if row.id == list_id:
            return row
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")


@router.get("", response_model=list[schemas.MediaListResponse])
def list_media_lists(
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Return the logged-in user's lists, oldest first."""
    return _load_lists(db, username)


@router.post("", response_model=schemas.MediaListResponse, status_code=status.HTTP_201_CREATED)
def create_media_list(
    payload: schemas.MediaListWrite,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Create an empty list owned by the logged-in user."""
    row = models.MediaList(
        username=username,
        name=payload.name,
        description=payload.description,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _load_list(db, username, row.id)


@router.put("/{list_id}", response_model=schemas.MediaListResponse)
def update_media_list(
    list_id: int,
    payload: schemas.MediaListWrite,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Rename a list or change its description."""
    row = _owned_list(db, list_id, username)
    row.name = payload.name
    row.description = payload.description
    db.commit()
    return _load_list(db, username, list_id)


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media_list(
    list_id: int,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Delete a list and its membership rows. Library entries stay."""
    row = _owned_list(db, list_id, username)
    db.query(models.MediaListItem).filter(models.MediaListItem.list_id == row.id).delete()
    db.delete(row)
    db.commit()
    return None


@router.post(
    "/{list_id}/items",
    response_model=schemas.MediaListResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_list_item(
    list_id: int,
    payload: schemas.MediaListItemCreate,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Append one of the user's library entries to the end of a list."""
    row = _owned_list(db, list_id, username)
    entry = (
        db.query(models.MediaEntry)
        .filter(
            models.MediaEntry.id == payload.entry_id,
            models.MediaEntry.username == username,
        )
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found in your library")

    existing = (
        db.query(models.MediaListItem)
        .filter(
            models.MediaListItem.list_id == row.id,
            models.MediaListItem.entry_id == entry.id,
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That media is already in this list")

    position = (
        db.query(models.MediaListItem)
        .filter(models.MediaListItem.list_id == row.id)
        .count()
    )
    db.add(
        models.MediaListItem(
            list_id=row.id,
            entry_id=entry.id,
            position=position,
        )
    )
    db.commit()
    return _load_list(db, username, list_id)


@router.delete("/{list_id}/items/{item_id}", response_model=schemas.MediaListResponse)
def remove_list_item(
    list_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Remove one entry from a list and close the gap in the order."""
    row = _owned_list(db, list_id, username)
    item = (
        db.query(models.MediaListItem)
        .filter(models.MediaListItem.id == item_id, models.MediaListItem.list_id == row.id)
        .first()
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List entry not found")

    db.delete(item)
    db.flush()
    remaining = (
        db.query(models.MediaListItem)
        .filter(models.MediaListItem.list_id == row.id)
        .order_by(models.MediaListItem.position.asc(), models.MediaListItem.id.asc())
        .all()
    )
    for index, remaining_item in enumerate(remaining):
        remaining_item.position = index
    db.commit()
    return _load_list(db, username, list_id)


@router.put("/{list_id}/order", response_model=schemas.MediaListResponse)
def reorder_list_items(
    list_id: int,
    payload: schemas.MediaListReorder,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
):
    """Replace a list's order. item_ids must be every current item, once each."""
    row = _owned_list(db, list_id, username)
    items = (
        db.query(models.MediaListItem)
        .filter(models.MediaListItem.list_id == row.id)
        .all()
    )
    by_id = {item.id: item for item in items}
    if len(payload.item_ids) != len(by_id) or set(payload.item_ids) != set(by_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must include every entry in the list exactly once",
        )

    for index, item_id in enumerate(payload.item_ids):
        by_id[item_id].position = index
    db.commit()
    return _load_list(db, username, list_id)
