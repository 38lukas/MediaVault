import pytest
from pydantic import ValidationError

from app.schemas import MediaListWrite


def test_list_name_and_description_are_trimmed():
    payload = MediaListWrite(name="  Top 10  ", description="   ")
    assert payload.name == "Top 10"
    assert payload.description is None


@pytest.mark.parametrize("name", ["", "   ", "x" * 121])
def test_list_name_must_be_1_to_120_chars(name):
    with pytest.raises(ValidationError):
        MediaListWrite(name=name)
