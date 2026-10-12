from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint

from app.database import Base


class Friendship(Base):
    __tablename__ = "friendships"
    __table_args__ = (
        UniqueConstraint("owner_username", "friend_username", name="uq_friendships_owner_friend"),
    )

    id = Column(Integer, primary_key=True, index=True)
    owner_username = Column(
        String,
        ForeignKey("user.username", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    friend_username = Column(
        String,
        ForeignKey("user.username", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
