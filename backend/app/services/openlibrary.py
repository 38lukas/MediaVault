"""Open Library cover lookup via the Search API."""

from __future__ import annotations

from typing import Any

import httpx

OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"
COVER_URL_TEMPLATE = "https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"


def fetch_cover_by_name(name: str) -> dict[str, Any]:
    """Search Open Library by title and return cover URL + external id."""
    trimmed = name.strip()
    if not trimmed:
        raise ValueError("Book title is required")

    response = httpx.get(
        OPEN_LIBRARY_SEARCH_URL,
        params={"title": trimmed, "fields": "key,title,cover_i", "limit": 10},
        headers={"User-Agent": "MediaVault/1.0"},
        timeout=15.0,
    )
    response.raise_for_status()
    results = response.json().get("docs") or []

    match = next(
        (book for book in results if book.get("cover_i") and book.get("key")),
        None,
    )
    if not match:
        raise LookupError(f'No Open Library cover found for "{trimmed}"')

    work_id = match["key"].rsplit("/", 1)[-1]
    return {
        "name": match.get("title", trimmed),
        "external_id": f"openlibrary_{work_id}",
        "poster_path": COVER_URL_TEMPLATE.format(cover_id=match["cover_i"]),
    }