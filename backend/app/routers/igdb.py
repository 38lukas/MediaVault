"""IGDB proxy routes under /api."""

from fastapi import APIRouter, HTTPException, Query
import httpx

from app import igdb as igdb_service

router = APIRouter(prefix="/igdb", tags=["igdb"])


@router.get("/cover")
def get_igdb_cover(name: str = Query(..., min_length=1)):
    """Look up an IGDB game by title and return its cover image URL."""
    try:
        return igdb_service.fetch_cover_by_name(name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"IGDB request failed: {e}",
        )
