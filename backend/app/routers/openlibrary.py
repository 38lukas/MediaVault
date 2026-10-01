"""Open Library proxy routes under /api."""

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.services import openlibrary as openlibrary_service

router = APIRouter(prefix="/openlibrary", tags=["openlibrary"])


@router.get("/cover")
def get_openlibrary_cover(name: str = Query(..., min_length=1)):
    """Look up a book by title and return its cover image URL."""
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