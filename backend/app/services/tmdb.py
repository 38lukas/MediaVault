"""TMDB poster and metadata lookup via API Read Access Token."""

from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Literal

import httpx

TMDB_SEARCH_MOVIE_URL = "https://api.themoviedb.org/3/search/movie"
TMDB_SEARCH_TV_URL = "https://api.themoviedb.org/3/search/tv"
TMDB_MOVIE_DETAILS_URL = "https://api.themoviedb.org/3/movie/{tmdb_id}"
TMDB_TV_DETAILS_URL = "https://api.themoviedb.org/3/tv/{tmdb_id}"
TMDB_TV_SEASON_URL = "https://api.themoviedb.org/3/tv/{tmdb_id}/season/{season_number}"
POSTER_URL_TEMPLATE = "https://image.tmdb.org/t/p/w500{poster_path}"
# TMDB search returns 20 hits per page. Five pages cover the autocomplete cap.
TMDB_PAGE_SIZE = 20
SEARCH_RESULT_LIMIT = 100

MediaType = Literal["Movie", "Series", "Anime"]


def _require_access_token() -> str:
    """Load the TMDB API Read Access Token from the environment."""
    access_token = os.getenv("TMDB_ACCESS_TOKEN")
    if not access_token:
        raise ValueError("Missing TMDB_ACCESS_TOKEN in root .env")
    return access_token


def _get_tmdb(url: str, params: dict[str, Any]) -> dict[str, Any]:
    """Run an authenticated GET request against the TMDB API."""
    response = httpx.get(
        url,
        params=params,
        headers={"Authorization": f"Bearer {_require_access_token()}"},
        timeout=15.0,
    )
    response.raise_for_status()
    return response.json()


def _names(items: list[dict[str, Any]] | None) -> list[str]:
    """Pull non-empty names out of a TMDB list of objects."""
    return [item["name"] for item in items or [] if item.get("name")]


def _validate_media_type(media_type: str) -> None:
    if media_type not in ("Movie", "Series", "Anime"):
        raise ValueError(f'Unsupported media_type "{media_type}"')


def _poster_url(poster_path: str | None) -> str | None:
    return POSTER_URL_TEMPLATE.format(poster_path=poster_path) if poster_path else None


def _movie_details(tmdb_id: int) -> dict[str, Any]:
    """Return display-ready metadata for a TMDB movie."""
    data = _get_tmdb(
        TMDB_MOVIE_DETAILS_URL.format(tmdb_id=tmdb_id),
        {"append_to_response": "credits"},
    )
    crew = (data.get("credits") or {}).get("crew") or []
    collection = data.get("belongs_to_collection") or {}
    return {
        "name": data.get("title") or f"TMDB movie {tmdb_id}",
        "external_id": f"tmdb_movie_{data['id']}",
        "poster_path": _poster_url(data.get("poster_path")),
        "release_date": data.get("release_date") or None,
        "genres": _names(data.get("genres")),
        "collection": collection.get("name"),
        "directors": _names([c for c in crew if c.get("job") == "Director"]),
        "production_companies": _names(data.get("production_companies")),
        "runtime": data.get("runtime") or None,
    }


def _tv_details(tmdb_id: int, include_original_title: bool) -> dict[str, Any]:
    """Return display-ready metadata for a TMDB TV show."""
    data = _get_tmdb(TMDB_TV_DETAILS_URL.format(tmdb_id=tmdb_id), {})
    details = {
        "name": data.get("name") or f"TMDB show {tmdb_id}",
        "external_id": f"tmdb_tv_{data['id']}",
        "poster_path": _poster_url(data.get("poster_path")),
        "first_air_date": data.get("first_air_date") or None,
        "last_air_date": data.get("last_air_date") or None,
        "genres": _names(data.get("genres")),
        "created_by": _names(data.get("created_by")),
        "production_companies": _names(data.get("production_companies")),
        "number_of_seasons": data.get("number_of_seasons"),
        "number_of_episodes": data.get("number_of_episodes"),
        "seasons": _season_summaries(data.get("seasons")),
    }
    if include_original_title:
        details["original_title"] = data.get("original_name") or None
    return details


def _season_name(season: dict[str, Any], season_number: int) -> str:
    return season.get("name") or f"Season {season_number}"


def _season_summaries(seasons: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    """List a show's regular seasons; season 0 holds TMDB "Specials" and is skipped."""
    return [
        {
            "season_number": season["season_number"],
            "name": _season_name(season, season["season_number"]),
            "poster_path": _poster_url(season.get("poster_path")),
            "air_date": season.get("air_date") or None,
            "episode_count": season.get("episode_count"),
        }
        for season in sorted(seasons or [], key=lambda s: s.get("season_number") or 0)
        if (season.get("season_number") or 0) > 0
    ]


def fetch_season(tmdb_id: int, season_number: int) -> dict[str, Any]:
    """Return display-ready metadata for one season of a TMDB TV show."""
    if tmdb_id < 1 or season_number < 1:
        raise ValueError("TMDB ID and season number must be positive")

    try:
        data = _get_tmdb(
            TMDB_TV_SEASON_URL.format(tmdb_id=tmdb_id, season_number=season_number),
            {},
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise LookupError(
                f"No season {season_number} found for TMDB show {tmdb_id}"
            ) from e
        raise

    episodes = data.get("episodes") or []
    episode_dates = [ep["air_date"] for ep in episodes if ep.get("air_date")]
    return {
        "season_number": season_number,
        "name": _season_name(data, season_number),
        "external_id": f"tmdb_tv_{tmdb_id}_s{season_number}",
        "poster_path": _poster_url(data.get("poster_path")),
        "air_date": data.get("air_date") or (min(episode_dates) if episode_dates else None),
        "last_air_date": max(episode_dates) if episode_dates else None,
        "episode_count": len(episodes),
    }


def _search_item(item: dict[str, Any], trimmed: str, is_movie: bool) -> dict[str, Any]:
    return {
        "id": item["id"],
        "name": item.get("title") or item.get("name") or trimmed,
        "release_date": (
            item.get("release_date") if is_movie else item.get("first_air_date")
        )
        or None,
    }


def _search_pages(url: str, query: str, limit: int) -> list[dict[str, Any]]:
    """Load enough TMDB search pages to fill `limit`, keeping page order."""
    first = _get_tmdb(url, {"query": query, "page": 1})
    pages = [first.get("results") or []]
    page_count = min(
        max(1, (limit + TMDB_PAGE_SIZE - 1) // TMDB_PAGE_SIZE),
        int(first.get("total_pages") or 1),
    )
    if page_count > 1:
        with ThreadPoolExecutor(max_workers=page_count - 1) as executor:
            futures = [
                executor.submit(_get_tmdb, url, {"query": query, "page": page})
                for page in range(2, page_count + 1)
            ]
            for future in futures:
                pages.append(future.result().get("results") or [])

    seen: set[int] = set()
    results: list[dict[str, Any]] = []
    for item in (item for page in pages for item in page):
        item_id = item.get("id")
        if item_id in seen:
            continue
        seen.add(item_id)
        results.append(item)
        if len(results) >= limit:
            break
    return results


def search_titles_by_name(
    name: str,
    media_type: MediaType,
    limit: int = SEARCH_RESULT_LIMIT,
) -> list[dict[str, Any]]:
    """Return lightweight TMDB matches for a movie or show title."""
    trimmed = name.strip()
    if not trimmed:
        raise ValueError("Media name is required")
    _validate_media_type(media_type)

    # Movies use /search/movie; Series and Anime both map to /search/tv.
    is_movie = media_type == "Movie"
    url = TMDB_SEARCH_MOVIE_URL if is_movie else TMDB_SEARCH_TV_URL
    capped = max(1, min(limit, SEARCH_RESULT_LIMIT))
    return [
        _search_item(item, trimmed, is_movie)
        for item in _search_pages(url, trimmed, capped)
    ]


def fetch_title_by_id(tmdb_id: int, media_type: MediaType) -> dict[str, Any]:
    """Return a selected title's poster and display-ready metadata from TMDB."""
    if tmdb_id < 1:
        raise ValueError("TMDB ID must be positive")
    _validate_media_type(media_type)

    try:
        if media_type == "Movie":
            return _movie_details(tmdb_id)
        return _tv_details(tmdb_id, include_original_title=media_type == "Anime")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise LookupError(f"No TMDB title found with ID {tmdb_id}") from e
        raise


def fetch_cover_by_name(name: str, media_type: MediaType) -> dict[str, Any]:
    """Keep the legacy title lookup while returning the full selected title data."""
    matches = search_titles_by_name(name, media_type, limit=1)
    if not matches:
        raise LookupError(f'No TMDB title found for "{name.strip()}"')
    return fetch_title_by_id(matches[0]["id"], media_type)
