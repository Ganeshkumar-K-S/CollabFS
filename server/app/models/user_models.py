from pydantic import BaseModel,Field
from datetime import datetime

class User(BaseModel):
    id:str = Field(...,alias="_id", description="User unique id")
    name:str = Field(..., description="Username")
    pwd:str = Field(..., min_length=8,max_length=15,description="Password")
    email:str =Field(...,description="Email")
    createAt:datetime=Field(...,description="User signup time")
    lastAccessed:datetime=Field(...,description="last login time")

    class Config:
        allow_population_by_field_name = True