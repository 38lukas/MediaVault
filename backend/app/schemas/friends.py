from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class FriendAddRequest(BaseModel):
    username: str = Field(min_length=1)


class FriendResponse(BaseModel):
    username: str
    avatar_path: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
