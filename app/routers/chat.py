from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from sqlalchemy import select
from sqlalchemy import func

from app.schemas.chat import CreateDirectChat, CreateGroupChat, ChatResponse, addMember, MemberResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.chat import Chat
from app.models.chatmembers import ChatMember
from app.dependencies.session import get_session
from app.dependencies.auth import get_current_user
from app.dependencies.chat import require_chat_admin, require_chat_member

router = APIRouter()

@router.post("/chats/direct")
async def create_direct_chat(data: CreateDirectChat, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    if current_user.user_id == data.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя создать чат с самим собой")
    result = await session.execute(select(User).where(User.user_id == data.user_id))
    existing_user = result.scalar_one_or_none()
    if not existing_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")
    result = await session.execute(select(ChatMember.chat_id)
                                   .join(Chat)
                                   .where(ChatMember.user_id.in_([current_user.user_id, data.user_id]), Chat.is_group.is_(False))
                                   .group_by(ChatMember.chat_id)
                                   .having(func.count(ChatMember.user_id) == 2))
    existing_chat = result.scalar_one_or_none()
    if existing_chat:
        return{
            "chat_id": existing_chat
        }
    chat = Chat(
        is_group=False
    )
    session.add(chat)
    
    await session.flush()

    member1 = ChatMember(
        user_id = current_user.user_id,
        chat_id = chat.chat_id,
        role = "admin"
    )

    member2 = ChatMember(
        user_id = data.user_id,
        chat_id = chat.chat_id,
        role = "member"
    )

    session.add_all([member1, member2])

    await session.commit()

    return {
        "chat_id": chat.chat_id
    }
                                   
    
@router.post("/chats/group")
async def create_group_chat(data: CreateGroupChat, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    if not data.member_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Группа должна иметь участников")
    result = await session.execute(select(User.user_id).where(User.user_id.in_(data.member_ids)))
    existing_id = result.scalars().all()
    if len(existing_id) != len(data.member_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "Пользователи не найдены")
    
    chat = Chat(name=data.name,
                is_group = True)
    session.add(chat)

    await session.flush()

    creator = ChatMember(
        user_id = current_user.user_id,
        chat_id = chat.chat_id,
        role = "admin"
    )
    session.add(creator)

    await session.flush()

    for member_id in data.member_ids:
        
        if member_id == current_user.user_id:
            continue

        member = ChatMember(
            user_id = member_id,
            chat_id = chat.chat_id,
            role = "member"
        )
        session.add(member)
    
    await session.commit()

    return{
        "chat_id": chat.chat_id
    }

@router.get("/chats", response_model=list[ChatResponse])
async def get_chats(current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Chat).join(ChatMember).where(ChatMember.user_id == current_user.user_id))

    chats = result.scalars().all()

    return chats

@router.post("/chats/{chat_id}/members")
async def add_member(chat_id: int, data: addMember, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    await require_chat_admin(chat_id, current_user, session)

    result = await session.execute(select(User).where(User.user_id == data.user_id))
    existing_user = result.scalar_one_or_none()

    if existing_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail= "Пользователя не существует")
    
    result = await session.execute(select(ChatMember).where(chat_id == ChatMember.chat_id, data.user_id == ChatMember.user_id))
    contain_user = result.scalar_one_or_none()
    if contain_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail = "Пользователь уже состоит в чате")
    
    member = ChatMember(user_id=data.user_id, chat_id=chat_id, role="member")

    session.add(member)

    await session.commit()

    return{
        "message": "Пользователь успешно добавлен"
    }
    
@router.delete("/chats/{chat_id}/members/{user_id}")
async def delete_member(chat_id: int, user_id: int, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    await require_chat_admin(chat_id, current_user, session)

    if user_id == current_user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail = "Администратор не может удалить сам себя")
    
    result = await session.execute(select(ChatMember).where(ChatMember.user_id == user_id, ChatMember.chat_id == chat_id))
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail= "Пользователь не найден")
    
    await session.delete(member)
    await session.commit()

    return{
        "message": "Участник успешно удален"
    }
    
    
@router.get("/chats/{chat_id}/members", response_model=list[MemberResponse])
async def check_members(chat_id: int, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    await require_chat_member(chat_id, current_user, session)

    result = await session.execute(
        select(ChatMember.user_id, User.login, ChatMember.role)
        .join(User, ChatMember.user_id == User.user_id)
        .where(ChatMember.chat_id == chat_id)
    )

    rows = result.all()

    members = []
    for row in rows:
        members.append({
            "user_id": row.user_id,
            "login": row.login,
            "role": row.role
        })

    return members