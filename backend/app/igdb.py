"""IGDB cover lookup via Twitch client-credentials OAuth."""

from __future__ import annotations

import os
import time
from typing import Any, Optional

import httpx

TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token"
IGDB_GAMES_URL = "https://api.igdb.com/v4/games"
COVER_URL_TEMPLATE = "https://images.igdb.com/igdb/image/upload/t_cover_big/{image_id}.jpg"

# Cached Twitch access token (module-level; fine for a single-process uvicorn).
_access_token: Optional[str] = None
_token_expires_at: float = 0.0


def _require_credentials() -> tuple[str, str]:
    """Load Twitch client credentials from environment variables."""
    client_id = os.getenv("TWITCH_CLIENT_ID")
    client_secret = os.getenv("TWITCH_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise ValueError(
            "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET in backend/.env"
        )
    return client_id, client_secret


def get_access_token() -> str:
    """Return a valid Twitch app access token, refreshing when expired."""
    global _access_token, _token_expires_at

    if _access_token and time.time() < _token_expires_at - 60:
        return _access_token

    client_id, client_secret = _require_credentials()
    response = httpx.post(
        TWITCH_TOKEN_URL,
        params={
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "client_credentials",
        },
        timeout=15.0,
    )
    response.raise_for_status()
    data = response.json()
    _access_token = data["access_token"]
    _token_expires_at = time.time() + float(data.get("expires_in", 3600))
    return _access_token


def fetch_cover_by_name(name: str) -> dict[str, Any]:
    """Search IGDB for a game by name and return cover URL + external id."""
    trimmed = name.strip()
    if not trimmed:
        raise ValueError("Game name is required")

    client_id, _ = _require_credentials()
    token = get_access_token()

    # Escape quotes so titles like O'Reilly don't break the IGDB query body.
    safe_name = trimmed.replace("\\", "\\\\").replace('"', '\\"')
    query = (
        f'search "{safe_name}"; '
        "fields id,name,cover.image_id; "
        "limit 1;"
    )

    response = httpx.post(
        IGDB_GAMES_URL,
        headers={
            "Client-ID": client_id,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
        content=query,
        timeout=15.0,
    )
    response.raise_for_status()
    games = response.json()

    if not games:
        raise LookupError(f'No IGDB game found for "{trimmed}"')

    game = games[0]
    cover = game.get("cover") or {}
    image_id = cover.get("image_id")
    if not image_id:
        raise LookupError(f'IGDB game "{game.get("name", trimmed)}" has no cover image')

    return {
        "name": game.get("name", trimmed),
        "external_id": f"igdb_{game['id']}",
        "poster_path": COVER_URL_TEMPLATE.format(image_id=image_id),
    }
