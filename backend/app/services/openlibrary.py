"""Open Library book search and metadata lookup."""

from __future__ import annotations

import re
from collections import Counter
from typing import Any

import httpx

OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"
OPEN_LIBRARY_WORK_URL = "https://openlibrary.org/works/{work_id}.json"
OPEN_LIBRARY_EDITIONS_URL = "https://openlibrary.org/works/{work_id}/editions.json"
OPEN_LIBRARY_AUTHOR_URL = "https://openlibrary.org{author_key}.json"
COVER_URL_TEMPLATE = "https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"

WORK_ID_PATTERN = re.compile(r"^OL\d+W$")
YEAR_PATTERN = re.compile(r"\b(\d{4})\b")

MAX_AUTHORS = 5
MAX_SUBJECTS = 8
MAX_PUBLISHERS = 5
MAX_SERIES = 3
EDITIONS_LIMIT = 50

# Library/catalog tags Open Library mixes into subjects that aren't genres.
SUBJECT_BLOCKLIST = {
    "accessible book",
    "protected daisy",
    "in library",
    "large type books",
    "open library staff picks",
    "lending library",
    "overdrive",
    "internet archive wishlist",
}


def _get_open_library(url: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    """Run a GET request against the Open Library API."""
    response = httpx.get(
        url,
        params=params,
        headers={"User-Agent": "MediaVault/1.0"},
        timeout=15.0,
        follow_redirects=True,
    )
    response.raise_for_status()
    return response.json()


def _unique(values: list[str], limit: int) -> list[str]:
    """Deduplicate case-insensitively, keep order, and cap the list."""
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        cleaned = value.strip()
        key = cleaned.lower()
        if cleaned and key not in seen:
            seen.add(key)
            result.append(cleaned)
        if len(result) >= limit:
            break
    return result


def _clean_subjects(subjects: list[str]) -> list[str]:
    """Drop catalog tags (e.g. "nyt:...", "Accessible book") from work subjects."""
    return _unique(
        [
            subject
            for subject in subjects
            if isinstance(subject, str)
            and ":" not in subject
            and "=" not in subject
            and subject.strip().lower() not in SUBJECT_BLOCKLIST
        ],
        MAX_SUBJECTS,
    )


def _author_names(work: dict[str, Any]) -> list[str]:
    """Resolve the work's author references to names (one request per author)."""
    names: list[str] = []
    for entry in (work.get("authors") or [])[:MAX_AUTHORS]:
        author_key = (entry.get("author") or {}).get("key")
        if not author_key:
            continue
        author = _get_open_library(OPEN_LIBRARY_AUTHOR_URL.format(author_key=author_key))
        if author.get("name"):
            names.append(author["name"])
    return _unique(names, MAX_AUTHORS)


def _earliest_year(editions: list[dict[str, Any]]) -> str | None:
    """Fall back to the earliest edition year when the work has no first_publish_date."""
    years = [
        int(match.group(1))
        for edition in editions
        if (match := YEAR_PATTERN.search(edition.get("publish_date") or ""))
    ]
    return str(min(years)) if years else None


def search_books_by_name(name: str) -> list[dict[str, Any]]:
    """Return up to five lightweight Open Library matches for a book title."""
    trimmed = name.strip()
    if not trimmed:
        raise ValueError("Book title is required")

    data = _get_open_library(
        OPEN_LIBRARY_SEARCH_URL,
        {"title": trimmed, "fields": "key,title,first_publish_year", "limit": 5},
    )
    return [
        {
            "id": book["key"].rsplit("/", 1)[-1],
            "name": book.get("title") or trimmed,
            "first_publish_year": book.get("first_publish_year"),
        }
        for book in data.get("docs") or []
        if book.get("key")
    ]


def fetch_book_by_id(work_id: str) -> dict[str, Any]:
    """Return a selected book's cover and display-ready metadata from Open Library."""
    if not WORK_ID_PATTERN.match(work_id):
        raise ValueError(f'Invalid Open Library work ID "{work_id}"')

    try:
        work = _get_open_library(OPEN_LIBRARY_WORK_URL.format(work_id=work_id))
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise LookupError(f"No Open Library book found with ID {work_id}") from e
        raise

    # Publishers and series live on editions, not on the work itself.
    editions = (
        _get_open_library(
            OPEN_LIBRARY_EDITIONS_URL.format(work_id=work_id),
            {"limit": EDITIONS_LIMIT},
        ).get("entries")
        or []
    )
    publisher_counts = Counter(
        publisher.strip()
        for edition in editions
        for publisher in edition.get("publishers") or []
        if isinstance(publisher, str) and publisher.strip()
    )
    series = _unique(
        [
            item
            for edition in editions
            for item in edition.get("series") or []
            if isinstance(item, str)
        ],
        MAX_SERIES,
    )

    cover_id = next(
        (cover for cover in work.get("covers") or [] if isinstance(cover, int) and cover > 0),
        None,
    ) or next(
        (
            cover
            for edition in editions
            for cover in edition.get("covers") or []
            if isinstance(cover, int) and cover > 0
        ),
        None,
    )

    return {
        "name": work.get("title") or f"Open Library book {work_id}",
        "external_id": f"openlibrary_{work_id}",
        "poster_path": COVER_URL_TEMPLATE.format(cover_id=cover_id) if cover_id else None,
        "author_name": _author_names(work),
        "first_publish_date": work.get("first_publish_date") or _earliest_year(editions),
        "subjects": _clean_subjects(work.get("subjects") or []),
        "publishers": [name for name, _ in publisher_counts.most_common(MAX_PUBLISHERS)],
        "series": series,
    }


def fetch_cover_by_name(name: str) -> dict[str, Any]:
    """Keep the legacy title lookup while returning the full selected book data."""
    matches = search_books_by_name(name)
    if not matches:
        raise LookupError(f'No Open Library book found for "{name.strip()}"')
    return fetch_book_by_id(matches[0]["id"])
