from pydantic import BaseModel, Field
from datetime import datetime

class Group(BaseModel):
    id: str = Field(..., alias="_id", description="Unique Group ID")
    gname: str = Field(..., description="Group name")
    description: str = Field(..., max_length=200, description="Group Description")
    createdBy: str = Field(..., description="Creater ID")
    createdAt: datetime = Field(..., description="Created time")
    starred: bool = Field(..., description="Important file")

    class Config:
        allow_population_by_field_name = True
