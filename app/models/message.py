from sqlalchemy import Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from sqlalchemy import func
from app.database import Base

class Message(Base):
    __tablename__ = "messages"

    message_id: Mapped[int] = mapped_column(
        primary_key = True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),
        nullable = False
    )
    chat_id: Mapped[int] = mapped_column(
        ForeignKey("chats.chat_id"),
        nullable = False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable = False
    )
    text: Mapped[str] = mapped_column(
        Text,
        nullable = False
    )