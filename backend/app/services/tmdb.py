"""TMDB cover/poster lookup via API Read Access Token."""

from __future__ import annotations

import os
from typing import Any, Literal

import httpx

TMDB_SEARCH_MOVIE_URL = "https://api.themoviedb.org/3/search/movie"
TMDB_SEARCH_TV_URL = "https://api.themoviedb.org/3/search/tv"
POSTER_URL_TEMPLATE = "https://image.tmdb.org/t/p/w500{poster_path}"

MediaType = Literal["Movie", "Series", "Anime"]


def _require_access_token() -> str:
    """Load the TMDB API Read Access Token from the environment."""
    access_token = os.getenv("TMDB_ACCESS_TOKEN")
    if not access_token:
        raise ValueError("Missing TMDB_ACCESS_TOKEN in root .env")
    return access_token


def fetch_cover_by_name(name: str, media_type: MediaType) -> dict[str, Any]:
    """Search TMDB by name and return poster URL + external id."""
    trimmed = name.strip()
    if not trimmed:
        raise ValueError("Media name is required")

    if media_type not in ("Movie", "Series", "Anime"):
        raise ValueError(f'Unsupported media_type "{media_type}"')

    access_token = _require_access_token()

    # Movies use /search/movie; Series and Anime both map to /search/tv.
    is_movie = media_type == "Movie"
    url = TMDB_SEARCH_MOVIE_URL if is_movie else TMDB_SEARCH_TV_URL
    id_prefix = "tmdb_movie" if is_movie else "tmdb_tv"

    response = httpx.get(
        url,
        params={"query": trimmed},
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15.0,
    )
    response.raise_for_status()
    results = response.json().get("results") or []

    # Prefer the first hit that actually has a poster image.
    match = next((item for item in results if item.get("poster_path")), None)
    if not match:
        raise LookupError(f'No TMDB result with poster found for "{trimmed}"')

    title = match.get("title") or match.get("name") or trimmed
    return {
        "name": title,
        "external_id": f"{id_prefix}_{match['id']}",
        "poster_path": POSTER_URL_TEMPLATE.format(poster_path=match["poster_path"]),
    }
