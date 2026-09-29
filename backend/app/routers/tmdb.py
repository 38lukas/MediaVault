"""TMDB proxy routes under /api."""

from typing import Literal

from fastapi import APIRouter, HTTPException, Query
import httpx

from app.services import tmdb as tmdb_service

router = APIRouter(prefix="/tmdb", tags=["tmdb"])

TmdbMediaType = Literal["Movie", "Series", "Anime"]


@router.get("/cover")
def get_tmdb_cover(
    name: str = Query(..., min_length=1),
    media_type: TmdbMediaType = Query(...),
):
    """Look up a TMDB title by name and return its poster image URL."""
    try:
        return tmdb_service.fetch_cover_by_name(name, media_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"TMDB request failed: {e}",
        )
