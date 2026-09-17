from pydantic import BaseModel

class CreateDirectChat(BaseModel):
    user_id: int

class CreateGroupChat(BaseModel):
    name: str
    member_ids: list[int]

class ChatResponse(BaseModel):
    chat_id: int
    name: str | None
    is_group: bool

    model_config = {
        "from_attributes": True
    }

class addMember(BaseModel):
    user_id: int

class MemberResponse(BaseModel):
    user_id: int
    login: str
    role: str