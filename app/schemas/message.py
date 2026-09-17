from pydantic import BaseModel
from datetime import datetime

class CreateMessage(BaseModel):
    text: str

class MessageResponse(BaseModel):
    message_id: int
    chat_id: int
    user_id: int
    text: str
    created_at: datetime

    class Config:
        from_attributes = True