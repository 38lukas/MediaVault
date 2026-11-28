import pytest
from pydantic import ValidationError

from app.schemas import UserAccountUpdate, UserSettingsUpdate


def test_settings_reject_values_unknown_to_the_frontend():
    with pytest.raises(ValidationError):
        UserSettingsUpdate(default_sort_field="popularity")
    with pytest.raises(ValidationError):
        UserSettingsUpdate(default_card_size=5)
    with pytest.raises(ValidationError):
        UserSettingsUpdate(profile_hidden_sections=["nonexistent"])


def test_account_update_rejects_empty_new_values():
    with pytest.raises(ValidationError):
        UserAccountUpdate(new_username="")
    with pytest.raises(ValidationError):
        UserAccountUpdate(new_password="")
