import httpx
import pytest

from app.services import igdb


@pytest.fixture
def queries(monkeypatch):
    """Capture IGDB query bodies and answer with canned games."""
    sent: list[str] = []
    answer: list[dict] = []

    def fake_query(query):
        sent.append(query)
        return answer

    monkeypatch.setattr(igdb, "_query_igdb", fake_query)
    return sent, answer


def test_search_escapes_quotes_and_caps_limit(queries):
    sent, answer = queries
    answer.append({"id": 1, "first_release_date": 1500000000})
    result = igdb.search_games_by_name(' Say "Hi" \\ ', limit=500)
    assert sent == ['search "Say \\"Hi\\" \\\\"; fields id,name,first_release_date; limit 100;']
    assert result == [{"id": 1, "name": 'Say "Hi" \\', "first_release_date": 1500000000}]


def test_search_needs_a_name():
    with pytest.raises(ValueError):
        igdb.search_games_by_name("   ")


def test_fetch_game_parses_metadata(queries):
    _, answer = queries
    answer.append({
        "id": 42,
        "name": "Hollow Knight",
        "cover": {"image_id": "abc"},
        "platforms": [{"name": "PC"}, {"name": "Switch"}],
        "franchises": [{"name": "Hollow Knight"}, {}],
        "genres": [{"name": "Platform"}],
        "involved_companies": [
            {"developer": True, "publisher": True, "company": {"name": "Team Cherry"}},
            {"developer": False, "publisher": True, "company": {"name": "Fangamer"}},
            {"developer": True, "company": {}},
        ],
    })
    game = igdb.fetch_game_by_id(42)
    assert game["external_id"] == "igdb_42"
    assert game["poster_path"] == "https://images.igdb.com/igdb/image/upload/t_cover_big/abc.jpg"
    assert game["platforms"] == ["PC", "Switch"]
    assert game["franchises"] == ["Hollow Knight"]
    assert game["developers"] == ["Team Cherry"]
    assert game["publishers"] == ["Team Cherry", "Fangamer"]


def test_fetch_game_without_cover_or_lists(queries):
    _, answer = queries
    answer.append({"id": 7})
    game = igdb.fetch_game_by_id(7)
    assert game["name"] == "IGDB game 7"
    assert game["poster_path"] is None
    assert game["platforms"] == game["genres"] == game["developers"] == []


def test_fetch_game_errors(queries):
    with pytest.raises(ValueError):
        igdb.fetch_game_by_id(0)
    with pytest.raises(LookupError):
        igdb.fetch_game_by_id(99)


def test_cover_by_name_without_match(queries):
    with pytest.raises(LookupError):
        igdb.fetch_cover_by_name("nothing")


def test_access_token_is_cached(monkeypatch):
    monkeypatch.setattr(igdb, "_access_token", None)
    monkeypatch.setattr(igdb, "_token_expires_at", 0.0)
    calls = []

    def fake_post(url, **kwargs):
        calls.append(url)
        return httpx.Response(200, json={"access_token": "tok", "expires_in": 3600},
                              request=httpx.Request("POST", url))

    monkeypatch.setattr(igdb.httpx, "post", fake_post)
    assert igdb.get_access_token() == "tok"
    assert igdb.get_access_token() == "tok"
    assert calls == [igdb.TWITCH_TOKEN_URL]


def test_missing_credentials(monkeypatch):
    monkeypatch.delenv("TWITCH_CLIENT_SECRET")
    with pytest.raises(ValueError, match="TWITCH"):
        igdb._require_credentials()
