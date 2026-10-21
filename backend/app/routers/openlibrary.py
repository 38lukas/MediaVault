"""Open Library proxy routes under /api."""

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.services import openlibrary as openlibrary_service

router = APIRouter(prefix="/openlibrary", tags=["openlibrary"])


@router.get("/search")
def search_openlibrary_books(name: str = Query(..., min_length=1)):
    """Return up to 100 Open Library book matches without fetching their full details."""
    try:
        return openlibrary_service.search_books_by_name(name)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502,
            detail=f"Open Library request failed: {error}",
        )


@router.get("/books/{work_id}")
def get_openlibrary_book(work_id: str):
    """Return cover and full metadata for a selected Open Library work."""
    try:
        return openlibrary_service.fetch_book_by_id(work_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502,
            detail=f"Open Library request failed: {error}",
        )


@router.get("/cover")
def get_openlibrary_cover(name: str = Query(..., min_length=1)):
    """Look up the first Open Library match and return its book metadata."""
    try:
        return openlibrary_service.fetch_cover_by_name(name)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502,
            detail=f"Open Library request failed: {error}",
        )
