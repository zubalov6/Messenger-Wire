from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query
from fastapi import WebSocket
from fastapi import WebSocketDisconnect
import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError

from app.models.user import User
from app.core.jwt import decode_access_token
from app.dependencies.message import create_message
from app.dependencies.session import get_session
from app.dependencies.chat import require_chat_member

from app.websocket.manager import manager

router = APIRouter()


@router.websocket("/ws/chats/{chat_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    chat_id: int,
    token: str = Query(...),
    session: AsyncSession = Depends(get_session)
):
    try:
        payload = decode_access_token(token)
    except JWTError:
        await websocket.close(code=1008)
        return
    
    user_id = payload.get("sub")
    if user_id is None:
        await websocket.close(code=1008)
        return
        
    result = await session.execute(select(User).where(User.user_id == int(user_id)))

    user = result.scalar_one_or_none()

    if user is None:
        await websocket.close(code=1008)
        return
    
    try:
        await require_chat_member(chat_id, user, session)
    except HTTPException:
        await websocket.close(code=1008)
        return
    
    await manager.connect(chat_id, websocket)

    try:
        while True:
            raw = await websocket.receive_text()

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "detail": "Невалидный JSON"})
                continue

            text = data.get("text")
            if not text or not text.strip():
                await websocket.send_json({"type": "error", "detail": "Пустое сообщение"})
                continue

            message = await create_message(chat_id, user.user_id, text, session)

            await manager.broadcast(chat_id, {
                "type": "message",
                "message_id": message.message_id,
                "chat_id": message.chat_id,
                "user_id": message.user_id,
                "text": message.text,
                "created_at": message.created_at.isoformat()
            })
    except WebSocketDisconnect:
        manager.disconnect(chat_id, websocket)