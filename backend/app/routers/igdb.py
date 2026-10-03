"""IGDB proxy routes under /api."""

from fastapi import APIRouter, HTTPException, Query
import httpx

from app.services import igdb as igdb_service

router = APIRouter(prefix="/igdb", tags=["igdb"])


@router.get("/search")
def search_igdb_games(name: str = Query(..., min_length=1)):
    """Return up to five IGDB title matches without fetching their full details."""
    try:
        return igdb_service.search_games_by_name(name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"IGDB request failed: {e}",
        )


@router.get("/games/{game_id}")
def get_igdb_game(game_id: int):
    """Return full metadata for a selected IGDB game."""
    try:
        return igdb_service.fetch_game_by_id(game_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"IGDB request failed: {e}",
        )


@router.get("/cover")
def get_igdb_cover(name: str = Query(..., min_length=1)):
    """Look up the first IGDB title match and return its game metadata."""
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
