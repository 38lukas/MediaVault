import pytest
from pydantic import ValidationError

from app.schemas import FavoriteSlotUpdate


def test_favorite_empty_pick_clears_slot():
    body = FavoriteSlotUpdate(category="All", title=None, poster_path=" ")
    assert body.title is None
    assert body.poster_path is None


def test_favorite_whitespace_title_is_rejected_not_cleared():
    with pytest.raises(ValidationError, match="required"):
        FavoriteSlotUpdate(category="All", title="  ", media_type="Movie", external_id="tmdb_movie_1")


def test_favorite_pick_is_trimmed():
    body = FavoriteSlotUpdate(category="All", title=" Up ", media_type="Movie", external_id=" tmdb_movie_1 ")
    assert (body.title, body.external_id) == ("Up", "tmdb_movie_1")


def test_favorite_partial_pick_is_rejected():
    with pytest.raises(ValidationError, match="required"):
        FavoriteSlotUpdate(category="All", title="Up", media_type="Movie")


def test_favorite_game_list_accepts_dlc_but_not_movies():
    assert FavoriteSlotUpdate(category="Game", title="DLC", media_type="DLC", external_id="igdb_2")
    with pytest.raises(ValidationError, match="does not match"):
        FavoriteSlotUpdate(category="Game", title="Up", media_type="Movie", external_id="tmdb_movie_1")


def test_favorite_type_list_needs_matching_type():
    assert FavoriteSlotUpdate(category="Anime", title="X", media_type="Anime", external_id="tmdb_tv_1")
    with pytest.raises(ValidationError, match="does not match"):
        FavoriteSlotUpdate(category="Anime", title="X", media_type="Series", external_id="tmdb_tv_1")


def test_favorite_unknown_category_is_rejected():
    with pytest.raises(ValidationError):
        FavoriteSlotUpdate(category="DLC")
