from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

class ChatMember(Base):
    __tablename__ = "chat_members"
    
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),
        primary_key = True
    )
    chat_id: Mapped[int] = mapped_column(
        ForeignKey("chats.chat_id"),
        primary_key = True
    )
    role: Mapped[str] = mapped_column(
        String(20),
        default="member"
    )