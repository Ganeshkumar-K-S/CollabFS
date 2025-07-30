from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class OtpSchema(BaseModel):
    email: str=Field(...,description="email")
    otp: str = Field(...,description="otp")
    createdAt: datetime=Field(...,description="created time")