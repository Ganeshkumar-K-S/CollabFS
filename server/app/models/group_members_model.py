from pydantic import BaseModel, Field
from datetime import datetime

class groupMembers(BaseModel):
    userId:str= Field(...,description="User Id")
    groupId: str = Field(..., description="Group Id")
    role: str = Field(..., description="role")
    joinedAt: datetime = Field(..., description="joined datetime")