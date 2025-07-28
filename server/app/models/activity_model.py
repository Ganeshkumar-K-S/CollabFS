from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class ActivityType(str, Enum):
    GROUP_CREATED = "GROUP_CREATED"
    GROUP_CLOSED = "GROUP_CLOSED"
    FILE_UPLOADED = "FILE_UPLOADED"
    FILE_DELETED = "FILE_DELETED"
    FILE_DOWNLOADED = "FILE_DOWNLOADED"

class Activity(BaseModel):
    userId: str = Field(..., description="Associated user ID")
    groupId: str = Field(..., description="Associated group ID")
    activity: ActivityType = Field(..., description="Type of activity performed")
    fileId: Optional[str] = Field(None, description="Associated file ID if applicable")
    timestamp: datetime = Field(..., description="Time of activity")
