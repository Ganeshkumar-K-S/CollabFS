from pydantic import BaseModel,Field
from datetime import datetime


class File(BaseModel):
    id : str = Field(...,description="File Identifier")
    name : str = Field(...,description="name of the file")
    uploadedBy : str = Field(...,description="uploader id of the file")
    uploadedAt : datetime = Field(...,description="uploaded date")
    GridFSId : str = Field(...,description="grid fs identifier")
    size : int = Field(...,description="size of the file")
    groupId : str = Field(...,description="Group id to which file is associated")
    pinned : bool = Field(...,description="Whether pinned or not")