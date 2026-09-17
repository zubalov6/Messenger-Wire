from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean

from app.database import Base

class Chat(Base):
    __tablename__ = "chats"
    
    chat_id: Mapped[int] = mapped_column(
        primary_key = True
    )
    name: Mapped[str | None] = mapped_column(
        String(50),
        nullable = True
    )
    is_group: Mapped[bool] = mapped_column(
        Boolean,
        default = False
    )