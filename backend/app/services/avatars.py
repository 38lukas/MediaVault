"""Avatar storage via S3-compatible object storage (AWS S3, R2, etc.)."""

from __future__ import annotations

import os
import re
import uuid
from functools import lru_cache
from urllib.parse import urlparse

import boto3
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, UploadFile, status

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_IMAGE_BYTES = 2 * 1024 * 1024  # 2 MB
AVATAR_KEY_PREFIX = "avatars/"


def safe_stem(username: str) -> str:
    """Filesystem-safe stem derived from a username.

    @param username: Account username.
    @returns Sanitized stem (never empty).
    """
    cleaned = re.sub(r"[^\w\-]", "_", username.strip(), flags=re.UNICODE)
    return cleaned or "user"


def _require_env(name: str) -> str:
    value = (os.getenv(name) or "").strip()
    if not value:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Avatar storage is not configured (missing {name})",
        )
    return value


@lru_cache(maxsize=1)
def _s3_client():
    """Build a cached S3 client from env (supports AWS S3 and S3-compatible endpoints)."""
    access_key = (
        os.getenv("S3_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY_ID") or ""
    ).strip()
    secret_key = (
        os.getenv("S3_SECRET_ACCESS_KEY") or os.getenv("AWS_SECRET_ACCESS_KEY") or ""
    ).strip()
    if not access_key or not secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Avatar storage is not configured (missing S3 credentials)",
        )

    region = (os.getenv("S3_REGION") or os.getenv("AWS_REGION") or "auto").strip()
    endpoint = (os.getenv("S3_ENDPOINT_URL") or "").strip() or None

    kwargs: dict = {
        "service_name": "s3",
        "aws_access_key_id": access_key,
        "aws_secret_access_key": secret_key,
        "region_name": region,
    }
    if endpoint:
        kwargs["endpoint_url"] = endpoint
        kwargs["config"] = Config(signature_version="s3v4")

    return boto3.client(**kwargs)


def _bucket() -> str:
    return _require_env("S3_BUCKET")


def _public_base_url() -> str:
    """Public base URL for objects (no trailing slash).

    Prefer S3_PUBLIC_BASE_URL. Falls back to a standard AWS virtual-hosted URL.
    """
    configured = (os.getenv("S3_PUBLIC_BASE_URL") or "").strip().rstrip("/")
    if configured:
        return configured

    bucket = _bucket()
    region = (os.getenv("S3_REGION") or os.getenv("AWS_REGION") or "us-east-1").strip()
    if region in {"", "auto", "us-east-1"}:
        return f"https://{bucket}.s3.amazonaws.com"
    return f"https://{bucket}.s3.{region}.amazonaws.com"


def _public_url(key: str) -> str:
    return f"{_public_base_url()}/{key}"


def _key_from_public_url(public_url: str | None) -> str | None:
    """Extract an object key from a stored public avatar URL.

    @param public_url: Full HTTPS URL previously returned by save_avatar.
    @returns Object key, or None when the URL is not one of ours.
    """
    if not public_url:
        return None

    try:
        base = _public_base_url()
    except HTTPException:
        return None

    if public_url.startswith(f"{base}/"):
        key = public_url[len(base) + 1 :]
        if key.startswith(AVATAR_KEY_PREFIX) and ".." not in key:
            return key

    path = urlparse(public_url).path.lstrip("/")
    if path.startswith(AVATAR_KEY_PREFIX) and ".." not in path:
        return path
    return None


def delete_avatar_file(public_path: str | None) -> None:
    """Best-effort delete of a previously stored avatar object.

    @param public_path: Public URL stored on the user row.
    """
    key = _key_from_public_url(public_path)
    if not key:
        return
    try:
        _s3_client().delete_object(Bucket=_bucket(), Key=key)
    except (BotoCoreError, ClientError, HTTPException):
        # Do not fail a new upload if cleanup of the old object fails.
        return


async def save_avatar(username: str, upload: UploadFile, previous_path: str | None) -> str:
    """Validate and upload an avatar to S3; replace any previous object.

    @param username: Account username (used in the object key).
    @param upload: Multipart image file.
    @param previous_path: Existing public URL to delete after a successful save.
    @returns Public HTTPS URL for the new avatar.
    """
    content_type = (upload.content_type or "").lower()
    ext = ALLOWED_CONTENT_TYPES.get(content_type)
    if ext is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar must be a JPEG, PNG, WebP, or GIF image",
        )

    data = await upload.read()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar must be 2 MB or smaller",
        )

    key = f"{AVATAR_KEY_PREFIX}{safe_stem(username)}_{uuid.uuid4().hex[:8]}{ext}"
    put_kwargs: dict = {
        "Bucket": _bucket(),
        "Key": key,
        "Body": data,
        "ContentType": content_type,
        "CacheControl": "public, max-age=31536000, immutable",
    }
    # Optional: only set when the bucket allows object ACLs.
    acl = (os.getenv("S3_OBJECT_ACL") or "").strip()
    if acl:
        put_kwargs["ACL"] = acl

    try:
        _s3_client().put_object(**put_kwargs)
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to upload avatar: {exc}",
        ) from exc

    delete_avatar_file(previous_path)
    return _public_url(key)
