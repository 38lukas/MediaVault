import asyncio
import io

import pytest
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from app.services import avatars

BASE = "https://pub.example.dev"


class FakeS3:
    def __init__(self, fail_put=False):
        self.fail_put = fail_put
        self.puts: list[dict] = []
        self.deleted: list[str] = []

    def put_object(self, **kwargs):
        if self.fail_put:
            raise ClientError({"Error": {"Code": "500", "Message": "boom"}}, "PutObject")
        self.puts.append(kwargs)

    def delete_object(self, Bucket, Key):
        self.deleted.append(Key)


@pytest.fixture
def s3(monkeypatch):
    monkeypatch.setenv("S3_BUCKET", "media")
    monkeypatch.setenv("S3_PUBLIC_BASE_URL", BASE + "/")
    fake = FakeS3()
    monkeypatch.setattr(avatars, "_s3_client", lambda: fake)
    return fake


def upload(data=b"img", content_type="image/png"):
    return UploadFile(file=io.BytesIO(data), filename="me", headers=Headers({"content-type": content_type}))


def save(file, previous=None):
    return asyncio.run(avatars.save_avatar("al ice/../x", file, previous))


def test_safe_stem():
    assert avatars.safe_stem(" al ice/../x ") == "al_ice____x"
    assert avatars.safe_stem("Jörg-1") == "Jörg-1"
    assert avatars.safe_stem("   ") == "user"


def test_public_base_url_fallbacks(monkeypatch):
    monkeypatch.setenv("S3_BUCKET", "media")
    assert avatars._public_base_url() == "https://media.s3.amazonaws.com"
    monkeypatch.setenv("S3_REGION", "eu-central-1")
    assert avatars._public_base_url() == "https://media.s3.eu-central-1.amazonaws.com"


def test_missing_bucket_is_503():
    with pytest.raises(HTTPException) as error:
        avatars._bucket()
    assert error.value.status_code == 503


def test_key_from_public_url_accepts_only_our_avatar_keys(s3):
    assert avatars._key_from_public_url(f"{BASE}/avatars/a.png") == "avatars/a.png"
    assert avatars._key_from_public_url("https://other.cdn/avatars/a.png") == "avatars/a.png"
    assert avatars._key_from_public_url(f"{BASE}/avatars/../secret") is None
    assert avatars._key_from_public_url(f"{BASE}/other/a.png") is None
    assert avatars._key_from_public_url(None) is None


def test_save_uploads_and_deletes_previous(s3):
    url = save(upload(content_type="image/JPEG"), previous=f"{BASE}/avatars/old.png")
    put = s3.puts[0]
    assert put["Bucket"] == "media"
    assert put["Key"].startswith("avatars/al_ice____x_") and put["Key"].endswith(".jpg")
    assert put["ContentType"] == "image/jpeg"
    assert "ACL" not in put
    assert url == f"{BASE}/{put['Key']}"
    assert s3.deleted == ["avatars/old.png"]


@pytest.mark.parametrize(
    "file, detail",
    [
        (upload(content_type="image/svg+xml"), "JPEG, PNG"),
        (upload(data=b""), "empty"),
        (upload(data=b"x" * (avatars.MAX_IMAGE_BYTES + 1)), "2 MB"),
    ],
)
def test_invalid_uploads_are_rejected(s3, file, detail):
    with pytest.raises(HTTPException) as error:
        save(file)
    assert error.value.status_code == 400
    assert detail in error.value.detail
    assert s3.puts == []


def test_failed_upload_keeps_previous_avatar(s3):
    s3.fail_put = True
    with pytest.raises(HTTPException) as error:
        save(upload(), previous=f"{BASE}/avatars/old.png")
    assert error.value.status_code == 502
    assert s3.deleted == []


def test_delete_ignores_foreign_urls(s3):
    avatars.delete_avatar_file("https://evil.example/not-an-avatar.png")
    assert s3.deleted == []
