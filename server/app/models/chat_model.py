from pydantic import BaseModel, Field
from datetime import datetime

class Chat(BaseModel):
    message : str = Field(...,description="encrypted message",min_length=1,max_length=1000)
    groupId : str = Field(...,description="associated group id")
    senderId : str = Field(...,description="chat sender id")
    timestamp : datetime = Field(...,description="message time")