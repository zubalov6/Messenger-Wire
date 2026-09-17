from app.core.oath import oauth2_scheme
from app.dependencies.session import get_session

from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from jose import JWTError

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.jwt import decode_access_token
from app.models.user import User
from app.models.chat import Chat
from app.models.chatmembers import ChatMember

async def require_chat_admin(chat_id: int, current_user: User, session: AsyncSession):
    result = await session.execute(select(Chat).where(Chat.chat_id == chat_id))

    chat = result.scalar_one_or_none()

    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "Чат не найден")
    
    if not chat.is_group:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail = "Нельзя изменять участников личного чата")
    
    result = await session.execute(select(ChatMember).where(ChatMember.chat_id == chat_id, ChatMember.user_id == current_user.user_id))

    membership = result.scalar_one_or_none()

    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "Нет доступа к этому чату")
    if membership.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail ="Недостаточно прав")
    return membership

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
    
