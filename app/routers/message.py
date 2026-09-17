from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from fastapi import Query
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from sqlalchemy import select
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError

from app.models.user import User
from app.models.message import Message
from app.models.chatmembers import ChatMember
from app.core.jwt import decode_access_token

from app.dependencies.session import get_session
from app.dependencies.auth import get_current_user
from app.dependencies.chat import require_chat_member
from app.schemas.message import CreateMessage, MessageResponse

from app.websocket.manager import manager

router = APIRouter()

@router.post("/chats/{chat_id}/messages", status_code=status.HTTP_201_CREATED)
async def send_message(chat_id: int, data: CreateMessage, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    await require_chat_member(chat_id, current_user, session)

    message = Message(chat_id=chat_id, user_id=current_user.user_id, text=data.text)

    session.add(message)
    await session.flush()
    await session.refresh(message)
    await session.commit()

    await manager.broadcast(
    chat_id,
    {
        "message_id": message.message_id,
        "chat_id": message.chat_id,
        "user_id": message.user_id,
        "text": message.text,
        "created_at": message.created_at.isoformat()
    }
)
    return {
        "message_id": message.message_id,
        "chat_id": message.chat_id,
        "user_id": message.user_id,
        "text": message.text,
        "created_at": message.created_at
    }

@router.get("/chats/{chat_id}/messages", response_model=list[MessageResponse])
async def get_messages(chat_id:int, before: int | None = None, limit: int = Query(default=50, le=100),current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    await require_chat_member(chat_id, current_user, session)

    query = select(Message).where(Message.chat_id == chat_id)

    if before is not None:
        query = query.where(Message.message_id < before)

    query = (query.order_by(Message.message_id.desc()).limit(limit))

    result = await session.execute(query)

    messages = result.scalars().all()
    messages.reverse()

    return messages

@router.get("/chats/{chat_id}/messages/search",response_model=list[MessageResponse])
async def search_messages(chat_id: int,query: str,current_user: User = Depends(get_current_user),session: AsyncSession = Depends(get_session),):
    await require_chat_member(chat_id, current_user, session)

    if len(query.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Поисковый запрос слишком короткий"
        )
    
    query_stmt = (select(Message).where(Message.chat_id == chat_id, Message.text.ilike(f"%{query}%").order_by(Message.message_id)))

    result = await session.execute(query_stmt)

    messages = result.scalars().all()

    return messages