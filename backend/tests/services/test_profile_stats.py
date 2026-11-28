from collections import Counter
from datetime import date, datetime, timedelta, timezone

from app import models
from app.services.profile_stats import completion_year, finished_counts, last_activity, log_achievements


def entry(**fields):
    values = {"media_type": "Game", "status": "Finished", "finished_at": None, **fields}
    return models.MediaEntry(**values)


def test_completion_year_uses_utc():
    late_new_years_eve = datetime(2024, 12, 31, 23, 30, tzinfo=timezone(timedelta(hours=-2)))
    assert completion_year(late_new_years_eve) == 2025
    assert completion_year(datetime(2024, 12, 31, 23, 30)) == 2024


def test_finished_counts_by_type_and_year():
    entries = [
        entry(media_type="Game", status="Finished", finished_at=datetime(2025, 5, 1, tzinfo=timezone.utc)),
        entry(media_type="Game", status="Played", finished_at=datetime(2024, 5, 1, tzinfo=timezone.utc)),
        entry(media_type="Movie", status="Watched"),  # finished, but no date
        entry(media_type="Book", status="Read", finished_at=datetime(2025, 1, 1, tzinfo=timezone.utc)),
        entry(media_type="Game", status="Playing", finished_at=datetime(2025, 5, 1, tzinfo=timezone.utc)),
    ]
    all_time = finished_counts(entries)
    assert (all_time.total, all_time.game, all_time.movie, all_time.book) == (4, 2, 1, 1)
    in_2025 = finished_counts(entries, year=2025)
    assert (in_2025.total, in_2025.game, in_2025.movie, in_2025.book) == (2, 1, 0, 1)


def test_log_achievements_unlock_at_thresholds():
    by_id = {a.id: a for a in log_achievements(Counter({"Game": 50, "Book": 9}))}
    assert by_id["game_log_10"].unlocked and by_id["game_log_50"].unlocked
    assert not by_id["game_log_100"].unlocked
    assert not by_id["book_log_10"].unlocked
    assert by_id["game_log_250"].rarity == "Platinum"
    assert len(by_id) == 20  # 5 media types x 4 tiers


def test_dlc_does_not_count_towards_game_achievements():
    by_id = {a.id: a for a in log_achievements(Counter({"DLC": 10}))}
    assert not by_id["game_log_10"].unlocked


def test_last_activity_is_latest_of_journal_start_and_finish():
    item = entry(
        played_dates=[date(2025, 3, 1)],
        started_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
        finished_at=datetime(2025, 4, 1, tzinfo=timezone.utc),
    )
    assert last_activity(item) == date(2025, 4, 1)
    assert last_activity(entry()) is None
