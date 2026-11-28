from datetime import date, datetime, timezone

import pytest
from pydantic import ValidationError

from app.schemas import MediaEntryCreate


def make(**fields):
    values = {"title": "Celeste", "media_type": "Game", "status": "Playing", "external_id": "igdb_1"}
    return MediaEntryCreate(**{**values, **fields})


def test_status_must_fit_media_type():
    with pytest.raises(ValidationError, match="not allowed for the type 'Book'"):
        make(media_type="Book", status="Watched")
    assert make(media_type="Book", status="Read").status.value == "Read"


def test_unknown_media_type_is_rejected():
    with pytest.raises(ValidationError):
        make(media_type="Podcast")


def test_playtime_only_for_games_and_dlc():
    assert make(media_type="DLC", playtime=90).playtime == 90
    with pytest.raises(ValidationError, match="Playtime"):
        make(media_type="Movie", status="Watched", playtime=90)
    with pytest.raises(ValidationError):
        make(playtime=-1)


def test_rewatches_not_allowed_for_books():
    assert make(media_type="Movie", status="Watched", number_of_rewatches=2).number_of_rewatches == 2
    with pytest.raises(ValidationError, match="not allowed for books"):
        make(media_type="Book", status="Read", number_of_rewatches=1)


@pytest.mark.parametrize("rating", [0, 11])
def test_rating_out_of_range(rating):
    with pytest.raises(ValidationError):
        make(rating=rating)


def test_season_number_starts_at_one():
    with pytest.raises(ValidationError):
        make(media_type="Series", status="Watching", season_number=0)


def test_start_and_finish_days_join_played_dates_sorted_and_unique():
    entry = make(
        played_dates=[date(2025, 3, 5), date(2025, 3, 1), date(2025, 3, 5)],
        started_at=datetime(2025, 2, 1, tzinfo=timezone.utc),
        finished_at=datetime(2025, 3, 1, tzinfo=timezone.utc),
    )
    assert entry.played_dates == [date(2025, 2, 1), date(2025, 3, 1), date(2025, 3, 5)]


def test_no_dates_gives_none():
    entry = make(played_dates=[])
    assert entry.played_dates is None
    assert entry.rewatch_dates is None


def test_rewatch_dates_are_limited_to_played_dates():
    entry = make(
        played_dates=[date(2025, 1, 2), date(2025, 1, 1)],
        rewatch_dates=[date(2025, 1, 2), date(2025, 1, 9), date(2025, 1, 2)],
    )
    assert entry.rewatch_dates == [date(2025, 1, 2)]
    assert make(played_dates=[date(2025, 1, 1)], rewatch_dates=[date(2025, 1, 9)]).rewatch_dates is None
