from enum import Enum

class MediaType(str, Enum):
    MOVIE = "Movie"
    SERIES = "Series"
    ANIME = "Anime"
    GAME = "Game"

class MediaStatus(str, Enum):
    WATCHING = "Watching"
    PLAYING = "Playing"
    FINISHED = "Finished"
    DROPPED = "Dropped"
    SHELVED = "Shelved"
    BACKLOG = "Backlog"
    WISHLIST = "Wishlist"
    WATCHLIST = "Watchlist"

ALLOWED_STATUSES = {
    MediaType.GAME: {
        MediaStatus.PLAYING,
        MediaStatus.FINISHED,
        MediaStatus.DROPPED,
        MediaStatus.SHELVED,
        MediaStatus.BACKLOG,
        MediaStatus.WISHLIST,
    },
    MediaType.MOVIE: {
        MediaStatus.WATCHING,
        MediaStatus.FINISHED,
        MediaStatus.DROPPED,
        MediaStatus.WATCHLIST,
    },
    MediaType.SERIES: {
        MediaStatus.WATCHING,
        MediaStatus.FINISHED,
        MediaStatus.DROPPED,
        MediaStatus.WATCHLIST,
    },
    MediaType.ANIME: {
        MediaStatus.WATCHING,
        MediaStatus.FINISHED,
        MediaStatus.DROPPED,
        MediaStatus.WATCHLIST,
    },
}