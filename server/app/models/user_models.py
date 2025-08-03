from pydantic import BaseModel,Field
from datetime import datetime

class User(BaseModel):
    id:str = Field(...,alias="_id", description="User unique id")
    name:str = Field(..., description="Username")
    pwd:str = Field(...,description="Password")
    email:str =Field(...,description="Email")
    createAt:datetime=Field(...,description="User signup time")
    lastAccessed:datetime=Field(...,description="last login time")
    storageUsed:int = Field(default=0, description="User storage")
    class Config:
        validate_by_name = True