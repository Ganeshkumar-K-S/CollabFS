from pydantic import BaseModel, Field
from datetime import datetime

class Group(BaseModel):
    id: str = Field(..., alias="_id", description="Unique Group ID")
    gname: str = Field(..., description="Group name")
    description: str = Field(..., max_length=1000, description="Group Description")
    createdBy: str = Field(..., description="Creater ID")
    createdAt: datetime = Field(..., description="Created time")
    starred: bool = Field(..., description="Important file")

    class Config:
        allow_population_by_field_name = True

class GroupCreateModel(BaseModel):
    userId : str = Field(...,description="group creator id")
    name : str = Field(...,description="name of the group")
    description : str = Field(...,description="description for the group")

class GroupModifyModel(BaseModel): 
    userId : str = Field(...,description="group creator id")
    groupId : str = Field(...,description="group id that should be renamed")
    fieldToUpdate : str = Field(...,description="field to be updated")
    newContent : str = Field(...,description="new name of the group")

class GroupSearchModel(BaseModel):
    userId : str = Field(...,description="user id")
    searchstr : str = Field("",description="string to be searched")
    
class GroupStarModel(BaseModel):
    userId : str = Field(...,description="user id")
    groupId : str = Field(...,description="group id that should be starred")
