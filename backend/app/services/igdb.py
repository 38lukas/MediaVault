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
            "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET in root .env"
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


def _query_igdb(query: str) -> list[dict[str, Any]]:
    """Run an Apicalypse query against the IGDB games endpoint."""
    client_id, _ = _require_credentials()
    token = get_access_token()
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
    return response.json()


def search_games_by_name(name: str) -> list[dict[str, Any]]:
    """Return up to five lightweight IGDB matches for a game title."""
    trimmed = name.strip()
    if not trimmed:
        raise ValueError("Game name is required")

    # Escape quotes so titles like O'Reilly don't break the IGDB query body.
    safe_name = trimmed.replace("\\", "\\\\").replace('"', '\\"')
    games = _query_igdb(
        f'search "{safe_name}"; fields id,name,first_release_date; limit 5;'
    )
    return [
        {
            "id": game["id"],
            "name": game.get("name", trimmed),
            "first_release_date": game.get("first_release_date"),
        }
        for game in games
    ]


def fetch_game_by_id(game_id: int) -> dict[str, Any]:
    """Return a selected game's cover and display-ready metadata from IGDB."""
    if game_id < 1:
        raise ValueError("Game ID must be positive")

    query = (
        "fields id,name,cover.image_id,first_release_date,platforms.name,"
        "franchises.name,genres.name,involved_companies.developer,"
        "involved_companies.publisher,involved_companies.company.name; "
        f"where id = {game_id}; limit 1;"
    )
    games = _query_igdb(query)

    if not games:
        raise LookupError(f"No IGDB game found with ID {game_id}")

    game = games[0]
    cover = game.get("cover") or {}
    image_id = cover.get("image_id")

    companies = game.get("involved_companies") or []
    developers = [
        item["company"]["name"]
        for item in companies
        if item.get("developer") and item.get("company", {}).get("name")
    ]
    publishers = [
        item["company"]["name"]
        for item in companies
        if item.get("publisher") and item.get("company", {}).get("name")
    ]
    franchises = [
        item["name"]
        for item in game.get("franchises") or []
        if isinstance(item, dict) and item.get("name")
    ]

    return {
        "name": game.get("name") or f"IGDB game {game_id}",
        "external_id": f"igdb_{game['id']}",
        "poster_path": (
            COVER_URL_TEMPLATE.format(image_id=image_id) if image_id else None
        ),
        "first_release_date": game.get("first_release_date"),
        "platforms": [platform["name"] for platform in game.get("platforms", [])],
        "franchises": franchises,
        "genres": [genre["name"] for genre in game.get("genres", [])],
        "developers": developers,
        "publishers": publishers
    }


def fetch_cover_by_name(name: str) -> dict[str, Any]:
    """Keep the legacy title lookup while returning the full selected game data."""
    matches = search_games_by_name(name)
    if not matches:
        raise LookupError(f'No IGDB game found for "{name.strip()}"')
    return fetch_game_by_id(matches[0]["id"])
