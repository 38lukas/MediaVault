"""IGDB / TMDB / Open Library proxy routes map service errors to HTTP status codes."""

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import igdb, openlibrary, tmdb

client = TestClient(app)

# (service module, function name, URL that calls it)
ROUTES = [
    (igdb, "search_games_by_name", "/api/igdb/search?name=x"),
    (igdb, "fetch_game_by_id", "/api/igdb/games/1"),
    (igdb, "fetch_cover_by_name", "/api/igdb/cover?name=x"),
    (tmdb, "search_titles_by_name", "/api/tmdb/search?name=x&media_type=Movie"),
    (tmdb, "fetch_title_by_id", "/api/tmdb/titles/1?media_type=Series"),
    (tmdb, "fetch_season", "/api/tmdb/titles/1/seasons/1"),
    (tmdb, "fetch_cover_by_name", "/api/tmdb/cover?name=x&media_type=Anime"),
    (openlibrary, "search_books_by_name", "/api/openlibrary/search?name=x"),
    (openlibrary, "fetch_book_by_id", "/api/openlibrary/books/OL1W"),
    (openlibrary, "fetch_cover_by_name", "/api/openlibrary/cover?name=x"),
]

ERRORS = [
    (ValueError("bad input"), 400),
    (httpx.ConnectError("down"), 502),
]


def raiser(error):
    def fake(*args, **kwargs):
        raise error
    return fake


@pytest.mark.parametrize("module, func, url", ROUTES)
def test_success_passes_result_through(monkeypatch, module, func, url):
    monkeypatch.setattr(module, func, lambda *args: {"ok": list(args)})
    response = client.get(url)
    assert response.status_code == 200
    assert response.json()["ok"]


@pytest.mark.parametrize("module, func, url", ROUTES)
@pytest.mark.parametrize("error, code", ERRORS)
def test_errors_map_to_status_codes(monkeypatch, module, func, url, error, code):
    monkeypatch.setattr(module, func, raiser(error))
    assert client.get(url).status_code == code


@pytest.mark.parametrize("module, func, url", [r for r in ROUTES if "search" not in r[1]])
def test_lookup_error_is_404(monkeypatch, module, func, url):
    monkeypatch.setattr(module, func, raiser(LookupError("missing")))
    response = client.get(url)
    assert response.status_code == 404
    assert response.json()["detail"] == "missing"


def test_tmdb_rejects_unknown_media_type():
    assert client.get("/api/tmdb/search?name=x&media_type=Game").status_code == 422


def test_empty_name_is_rejected():
    assert client.get("/api/igdb/search?name=").status_code == 422
