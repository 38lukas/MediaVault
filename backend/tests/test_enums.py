from app.enums import ALLOWED_STATUSES, MediaStatus, MediaType


def test_every_media_type_has_allowed_statuses():
    assert set(ALLOWED_STATUSES) == set(MediaType)
    assert all(ALLOWED_STATUSES[media_type] for media_type in MediaType)


def test_dlc_uses_game_statuses():
    assert ALLOWED_STATUSES[MediaType.DLC] == ALLOWED_STATUSES[MediaType.GAME]


def test_books_cannot_be_watched():
    assert MediaStatus.WATCHED not in ALLOWED_STATUSES[MediaType.BOOK]
    assert MediaStatus.READ in ALLOWED_STATUSES[MediaType.BOOK]
