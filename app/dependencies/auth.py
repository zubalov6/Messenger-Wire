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



async def get_current_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)):
    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "Неверный токен")
    user_id = payload.get("sub")
    
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "Пользователь не существует")
    
    result = await session.execute(select(User).where(User.user_id == int(user_id)))

    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "Пользователь не найден")

    return user