from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint

from app.database import Base


class MediaList(Base):
    __tablename__ = "media_lists"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(
        String,
        ForeignKey("user.username", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)


class MediaListItem(Base):
    __tablename__ = "media_list_items"
    __table_args__ = (
        UniqueConstraint("list_id", "entry_id", name="uq_media_list_items_list_entry"),
    )

    id = Column(Integer, primary_key=True)
    list_id = Column(
        Integer,
        ForeignKey("media_lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    entry_id = Column(
        Integer,
        ForeignKey("media_entries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    position = Column(Integer, nullable=False)
