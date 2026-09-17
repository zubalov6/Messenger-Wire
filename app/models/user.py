from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String

from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    user_id: Mapped[int] = mapped_column(
        primary_key = True
    )
    login: Mapped[str] = mapped_column(
        String(50),
        unique = True,
        nullable = False
    )
    hash_password: Mapped[str] = mapped_column(
        String(255),
        nullable = False
    )
