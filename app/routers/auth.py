from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.auth import Register, Login
from app.database import async_session
from app.models.user import User
from app.core.security import hash_password, verify_password
from app.core.jwt import create_access_token
from app.dependencies.session import get_session
from app.dependencies.auth import get_current_user

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: Register, session: AsyncSession = Depends(get_session)):
        

        result = await session.execute(select(User).where(User.login == data.login))

        existing_user = result.scalar_one_or_none()


        if existing_user:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Такой логин уже существует.")

        user = User(
                login = data.login,
                hash_password = hash_password(data.password)
        )

        session.add(user)

        await session.commit()
        await session.refresh(user)

        return{
                "id": user.user_id,
                "login": user.login
        }

@router.post("/login")
async def login(data: Login, session: AsyncSession = Depends(get_session)):
        result = await session.execute(select(User).where(User.login == data.login))

        existing_user = result.scalar_one_or_none()

        if not existing_user:
                raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail = "Неверный логин или пароль"
                )
        
        if not verify_password(data.password, existing_user.hash_password):
                raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail = "Неверный логин или пароль"
                )
        
        access_token = create_access_token(
                {
                        "sub": str(existing_user.user_id)
                }
        )
        return{
                "access_token": access_token,
                "token_type": "bearer"
        }

@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
        return{
                "id": current_user.user_id,
                "login": current_user.login
        }