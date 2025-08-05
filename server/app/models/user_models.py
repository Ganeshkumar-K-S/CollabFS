from pydantic import BaseModel,Field
from datetime import datetime
from bson import Int64

class User(BaseModel):
    id:str = Field(...,alias="_id", description="User unique id")
    name:str = Field(..., description="Username")
    pwd:str = Field(...,description="Password")
    email:str =Field(...,description="Email")
    createAt:datetime=Field(...,description="User signup time")
    lastAccessed:datetime=Field(...,description="last login time")
    storageUsed: Int64 = Field(default=Int64(0), description="User storage")
    
    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True  

class LoginModel(BaseModel):
    email: str
    pwd: str

class SignupModel(BaseModel):
    email: str
    username: str
    pwd: str

class UserModel(BaseModel):
    email: str
    username: str
    pwd: str
    otp: str

class EmailRequest(BaseModel):
    email: str

class UpdatePassword(BaseModel):
    email:str
    pwd:str
    otp:str