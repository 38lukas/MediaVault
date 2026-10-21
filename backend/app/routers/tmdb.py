"""TMDB proxy routes under /api."""

from typing import Literal

from fastapi import APIRouter, HTTPException, Query
import httpx

from app.services import tmdb as tmdb_service

router = APIRouter(prefix="/tmdb", tags=["tmdb"])

TmdbMediaType = Literal["Movie", "Series", "Anime"]


@router.get("/search")
def search_tmdb_titles(
    name: str = Query(..., min_length=1),
    media_type: TmdbMediaType = Query(...),
):
    """Return up to 100 TMDB title matches without fetching their full details."""
    try:
        return tmdb_service.search_titles_by_name(name, media_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"TMDB request failed: {e}",
        )


@router.get("/titles/{tmdb_id}")
def get_tmdb_title(tmdb_id: int, media_type: TmdbMediaType = Query(...)):
    """Return poster and full metadata for a selected TMDB movie or show."""
    try:
        return tmdb_service.fetch_title_by_id(tmdb_id, media_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"TMDB request failed: {e}",
        )


@router.get("/titles/{tmdb_id}/seasons/{season_number}")
def get_tmdb_season(tmdb_id: int, season_number: int):
    """Return poster and metadata for one season of a TMDB show."""
    try:
        return tmdb_service.fetch_season(tmdb_id, season_number)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"TMDB request failed: {e}",
        )


@router.get("/cover")
def get_tmdb_cover(
    name: str = Query(..., min_length=1),
    media_type: TmdbMediaType = Query(...),
):
    """Look up the first TMDB title match and return its metadata."""
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
