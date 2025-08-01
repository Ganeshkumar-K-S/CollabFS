from fastapi import APIRouter,Request,HTTPException,Depends
from starlette.status import HTTP_403_FORBIDDEN
from dotenv import load_dotenv
from app.db.connection import get_db
from app.db.collections import group
from app.models.group_model import GroupCreateModel
import uuid
import os
from datetime import datetime,timezone

load_dotenv()

group_engine=APIRouter(prefix="/group")


def verify_file_api(request : Request):
    expected_key=os.getenv('GROUP_API_KEY')
    key_name="x-api-key"
    response_key=request.headers.get(key_name)
    if expected_key!=response_key:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Unauthorized access"
        )

@group_engine.post("/create",dependencies=[Depends(get_db)])
async def create_group(
    create_data : GroupCreateModel,
    db = Depends(get_db)
):
    try:
        user_id=create_data.user_id
        groupname=create_data.name 
        randid=uuid.uuid4().hex

        group_data={
            "_id:": (groupname + randid),
            "name": groupname,
            "description" : "",
            "createdBy" : user_id,
            "createdAt" : datetime.now(timezone.utc)
        }

        await db.group.insert_one(
            group_data
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
