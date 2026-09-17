from app.core.oath import oauth2_scheme
from app.dependencies.session import get_session

from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.chat import Chat
from app.models.chatmembers import ChatMember
from app.models.message import Message


async def create_message(chat_id: int, user_id: int, text: str, session: AsyncSession) -> Message:
    message = Message(chat_id=chat_id, user_id=user_id, text=text)
    session.add(message)
    await session.commit()
    await session.refresh(message)
    return message

async def require_chat_member(chat_id: int, current_user: User, session: AsyncSession):
    result = await session.execute(select(Chat).where(Chat.chat_id == chat_id))

    chat = result.scalar_one_or_none()

    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "Чат не найден")
    
    result = await session.execute(select(ChatMember).where(ChatMember.chat_id == chat_id, ChatMember.user_id == current_user.user_id))

    membership = result.scalar_one_or_none()

    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "Нет доступа к этому чату")
    return membership
