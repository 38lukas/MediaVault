"""Media type/status enums and allowed status combinations."""

from enum import Enum


class MediaType(str, Enum):
    """Supported media categories stored in media_entries.media_type."""
    MOVIE = "Movie"
    SERIES = "Series"
    ANIME = "Anime"
    GAME = "Game"
    DLC = "DLC"
    BOOK = "Book"


class MediaStatus(str, Enum):
    """Supported progress labels stored in media_entries.status."""
    WATCHING = "Watching"
    PLAYING = "Playing"
    FINISHED = "Finished"
    PLAYED = "Played"
    WATCHED = "Watched"
    DROPPED = "Dropped"
    SHELVED = "Shelved"
    BACKLOG = "Backlog"
    WISHLIST = "Wishlist"
    WATCHLIST = "Watchlist"
    READING = "Reading"
    READ = "Read"


_GAME_STATUSES = {
    MediaStatus.PLAYING,
    MediaStatus.FINISHED,
    MediaStatus.PLAYED,
    MediaStatus.DROPPED,
    MediaStatus.SHELVED,
    MediaStatus.BACKLOG,
    MediaStatus.WISHLIST,
}

ALLOWED_STATUSES = {
    MediaType.GAME: _GAME_STATUSES,
    MediaType.DLC: _GAME_STATUSES,
    MediaType.MOVIE: {
        MediaStatus.WATCHING,
        MediaStatus.WATCHED,
        MediaStatus.DROPPED,
        MediaStatus.WATCHLIST,
    },
    MediaType.SERIES: {
        MediaStatus.WATCHING,
        MediaStatus.WATCHED,
        MediaStatus.DROPPED,
        MediaStatus.WATCHLIST,
    },
    MediaType.ANIME: {
        MediaStatus.WATCHING,
        MediaStatus.WATCHED,
        MediaStatus.DROPPED,
        MediaStatus.WATCHLIST,
    },
    MediaType.BOOK: {
        MediaStatus.READING,
        MediaStatus.READ,
        MediaStatus.DROPPED,
        MediaStatus.BACKLOG,
    }
}
