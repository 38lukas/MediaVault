import httpx
import pytest

from app.services import tmdb


def not_found(url):
    response = httpx.Response(404, request=httpx.Request("GET", url))
    raise httpx.HTTPStatusError("404", request=response.request, response=response)


@pytest.fixture
def tmdb_api(monkeypatch):
    """Route _get_tmdb calls to canned responses keyed by URL; unknown URLs give 404."""
    responses: dict[str, object] = {}
    calls: list[tuple[str, dict]] = []

    def fake_get(url, params):
        calls.append((url, params))
        if url not in responses:
            not_found(url)
        answer = responses[url]
        return answer(params) if callable(answer) else answer

    monkeypatch.setattr(tmdb, "_get_tmdb", fake_get)
    return responses, calls


def test_movie_details(tmdb_api):
    responses, _ = tmdb_api
    responses[tmdb.TMDB_MOVIE_DETAILS_URL.format(tmdb_id=14160)] = {
        "id": 14160,
        "title": "Up",
        "poster_path": "/up.jpg",
        "release_date": "",
        "genres": [{"name": "Animation"}, {"name": ""}],
        "belongs_to_collection": None,
        "credits": {"crew": [{"job": "Director", "name": "Pete Docter"}, {"job": "Writer", "name": "Bob"}]},
        "runtime": 0,
    }
    movie = tmdb.fetch_title_by_id(14160, "Movie")
    assert movie["external_id"] == "tmdb_movie_14160"
    assert movie["poster_path"] == "https://image.tmdb.org/t/p/w500/up.jpg"
    assert movie["release_date"] is None
    assert movie["genres"] == ["Animation"]
    assert movie["directors"] == ["Pete Docter"]
    assert movie["collection"] is None
    assert movie["runtime"] is None


def test_tv_details_skip_specials_and_anime_gets_original_title(tmdb_api):
    responses, _ = tmdb_api
    responses[tmdb.TMDB_TV_DETAILS_URL.format(tmdb_id=5)] = {
        "id": 5,
        "name": "Frieren",
        "original_name": "Sousou no Frieren",
        "seasons": [
            {"season_number": 2, "name": "", "episode_count": 10},
            {"season_number": 0, "name": "Specials"},
            {"season_number": 1, "name": "Season 1", "poster_path": "/s1.jpg"},
        ],
    }
    anime = tmdb.fetch_title_by_id(5, "Anime")
    assert anime["original_title"] == "Sousou no Frieren"
    assert [(s["season_number"], s["name"]) for s in anime["seasons"]] == [(1, "Season 1"), (2, "Season 2")]
    assert "original_title" not in tmdb.fetch_title_by_id(5, "Series")


def test_unknown_title_is_lookup_error(tmdb_api):
    with pytest.raises(LookupError):
        tmdb.fetch_title_by_id(1, "Movie")


def test_invalid_title_arguments():
    with pytest.raises(ValueError):
        tmdb.fetch_title_by_id(0, "Movie")
    with pytest.raises(ValueError):
        tmdb.fetch_title_by_id(1, "Game")


def test_season_dates_fall_back_to_episodes(tmdb_api):
    responses, _ = tmdb_api
    responses[tmdb.TMDB_TV_SEASON_URL.format(tmdb_id=5, season_number=2)] = {
        "episodes": [{"air_date": "2024-02-01"}, {"air_date": None}, {"air_date": "2024-01-01"}],
    }
    season = tmdb.fetch_season(5, 2)
    assert season["external_id"] == "tmdb_tv_5_s2"
    assert season["name"] == "Season 2"
    assert (season["air_date"], season["last_air_date"]) == ("2024-01-01", "2024-02-01")
    assert season["episode_count"] == 3


def test_season_errors(tmdb_api):
    with pytest.raises(ValueError):
        tmdb.fetch_season(5, 0)
    with pytest.raises(LookupError):
        tmdb.fetch_season(5, 9)


def test_search_loads_pages_dedupes_and_caps(tmdb_api):
    responses, calls = tmdb_api

    def page(params):
        n = params["page"]
        # Page 2 repeats id 19 from page 1, which must be dropped.
        ids = range(0, 20) if n == 1 else range(19 + (n - 2) * 20, 39 + (n - 2) * 20)
        return {"total_pages": 3, "results": [{"id": i, "name": f"Show {i}", "first_air_date": ""} for i in ids]}

    responses[tmdb.TMDB_SEARCH_TV_URL] = page
    results = tmdb.search_titles_by_name(" Show ", "Series", limit=45)
    assert sorted(p["page"] for _, p in calls) == [1, 2, 3]
    assert len(results) == 45
    assert [r["id"] for r in results] == list(range(45))
    assert results[0] == {"id": 0, "name": "Show 0", "release_date": None}


def test_search_movie_uses_title_and_stops_at_total_pages(tmdb_api):
    responses, calls = tmdb_api
    responses[tmdb.TMDB_SEARCH_MOVIE_URL] = {
        "total_pages": 1, "results": [{"id": 1, "title": "Up", "release_date": "2009-05-29"}],
    }
    assert tmdb.search_titles_by_name("up", "Movie") == [{"id": 1, "name": "Up", "release_date": "2009-05-29"}]
    assert len(calls) == 1


def test_search_needs_a_name():
    with pytest.raises(ValueError):
        tmdb.search_titles_by_name("  ", "Movie")


def test_missing_token(monkeypatch):
    monkeypatch.delenv("TMDB_ACCESS_TOKEN")
    with pytest.raises(ValueError, match="TMDB_ACCESS_TOKEN"):
        tmdb._require_access_token()
