import httpx
import pytest

from app.services import openlibrary as ol


def test_unique_dedupes_case_insensitively_and_caps():
    assert ol._unique([" Tor ", "tor", "", "Ace", "Baen"], limit=2) == ["Tor", "Ace"]


def test_clean_subjects_drops_catalog_tags():
    subjects = ["Fantasy", "nyt:best=1", "Accessible book", "fiction: general", "fantasy", "Dragons", 7]
    assert ol._clean_subjects(subjects) == ["Fantasy", "Dragons"]


def test_earliest_year_from_editions():
    editions = [{"publish_date": "May 1954"}, {"publish_date": "1937"}, {"publish_date": "n.d."}, {}]
    assert ol._earliest_year(editions) == "1937"
    assert ol._earliest_year([{}]) is None


@pytest.fixture
def api(monkeypatch):
    responses: dict[str, dict] = {}

    def fake_get(url, params=None):
        if url not in responses:
            response = httpx.Response(404, request=httpx.Request("GET", url))
            raise httpx.HTTPStatusError("404", request=response.request, response=response)
        return responses[url]

    monkeypatch.setattr(ol, "_get_open_library", fake_get)
    return responses


def test_search_parses_work_ids(api):
    api[ol.OPEN_LIBRARY_SEARCH_URL] = {
        "docs": [{"key": "/works/OL1W", "title": "Dune", "first_publish_year": 1965}, {"title": "No key"}],
    }
    assert ol.search_books_by_name(" dune ") == [{"id": "OL1W", "name": "Dune", "first_publish_year": 1965}]


def test_search_needs_a_title():
    with pytest.raises(ValueError):
        ol.search_books_by_name(" ")


def test_fetch_book_combines_work_editions_and_authors(api):
    api[ol.OPEN_LIBRARY_WORK_URL.format(work_id="OL1W")] = {
        "title": "The Hobbit",
        "covers": [-1],
        "authors": [{"author": {"key": "/authors/OL9A"}}, {"author": {}}],
        "subjects": ["Fantasy", "In library"],
    }
    api[ol.OPEN_LIBRARY_EDITIONS_URL.format(work_id="OL1W")] = {
        "entries": [
            {"publishers": ["Allen & Unwin", "HarperCollins"], "publish_date": "1937", "covers": [55]},
            {"publishers": ["HarperCollins "], "series": ["Middle-earth"], "publish_date": "1966"},
        ],
    }
    api[ol.OPEN_LIBRARY_AUTHOR_URL.format(author_key="/authors/OL9A")] = {"name": "J. R. R. Tolkien"}
    book = ol.fetch_book_by_id("OL1W")
    assert book["external_id"] == "openlibrary_OL1W"
    assert book["poster_path"] == "https://covers.openlibrary.org/b/id/55-L.jpg"  # edition cover fallback
    assert book["author_name"] == ["J. R. R. Tolkien"]
    assert book["first_publish_date"] == "1937"  # earliest edition year
    assert book["subjects"] == ["Fantasy"]
    assert book["publishers"] == ["HarperCollins", "Allen & Unwin"]  # most common first
    assert book["series"] == ["Middle-earth"]


def test_fetch_book_errors(api):
    with pytest.raises(ValueError):
        ol.fetch_book_by_id("../OL1W")
    with pytest.raises(LookupError):
        ol.fetch_book_by_id("OL404W")


def test_cover_by_name_without_match(api):
    api[ol.OPEN_LIBRARY_SEARCH_URL] = {"docs": []}
    with pytest.raises(LookupError):
        ol.fetch_cover_by_name("nothing")
