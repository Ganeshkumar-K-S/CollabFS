from fastapi import APIRouter, Request, HTTPException, Depends
from starlette.status import HTTP_403_FORBIDDEN
from dotenv import load_dotenv
from app.db.connection import get_db 
from app.db.collections import group, groupmembers, activities 
from app.models.group_model import GroupCreateModel, GroupModifyModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
import uuid
import os

load_dotenv()

group_engine = APIRouter(prefix="/group")


def verify_group_api(request: Request):
    expected_key = os.getenv('GROUP_API_KEY')
    key_name = "x-api-key"
    response_key = request.headers.get(key_name)
    if expected_key != response_key:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Unauthorized access"
        )


@group_engine.post("/create", dependencies=[Depends(verify_group_api)])
async def create_group(
    create_data: GroupCreateModel,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    session = await db.client.start_session()
    try:
        async with session.start_transaction():
            user_id = create_data.user_id
            groupname = create_data.name
            print(groupname)
            print(type(groupname))
            group_id = groupname + "_" + uuid.uuid4().hex
            print(group_id)
            print(type(group_id))
            group_data = {
                "_id": group_id,
                "gname": groupname,
                "description": "",
                "createdBy": user_id,
                "createdAt": datetime.now(timezone.utc),
                "starred" : False
            }
            await db.group.insert_one(group_data, session=session)

            member_data = {
                "userId": user_id,
                "groupId": group_id,
                "role": "owner",
                "joinedAt": datetime.now(timezone.utc)
            }
            await db.groupmembers.insert_one(member_data, session=session)

            activity_data = {
                "userId": user_id,
                "groupId": group_id,
                "activityType": "GROUP_CREATED",
                "fileId": None,
                "timestamp": datetime.now(timezone.utc)
            }
            await db.activities.insert_one(activity_data, session=session)

        return {
            "message": "Group created successfully",
            "groupId": group_id
        }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Failed to create group: {str(e)}")

    finally:
        await session.end_session()

@group_engine.patch("/rename",dependencies=[Depends(verify_group_api)])
async def rename_group(
        rename_data : GroupModifyModel,
        db : AsyncIOMotorDatabase = Depends(get_db)
):
        async with await db.client.start_session() as session:
             async with session.start_transaction():
                try:
                    await db.group.update_one(
                        {
                            "_id":rename_data.groupId
                        },
                        {
                            "$set" :{
                                "gname":rename_data.newContent
                            }
                        }
                    )

                    activity_data={
                        "userId" : rename_data.userId,
                        "groupId" : rename_data.groupId,
                        "activityType" : "GROUP_RENAMED",
                        "fileId" : None,
                        "timestamp":datetime.now(timezone.utc)
                    }

                    await db.activities.insert_one(activity_data)

                    return {"message":"group name changed successfully"}
                except Exception as e:
                    raise HTTPException(status_code=500, detail=str(e))

@group_engine.patch("/description",dependencies=[Depends(verify_group_api)])
async def description_change(
        rename_data : GroupModifyModel,
        db : AsyncIOMotorDatabase = Depends(get_db)
):
        async with await db.client.start_session() as session:
             async with session.start_transaction():
                try:
                    await db.group.update_one(
                        {
                            "_id":rename_data.groupId
                        },
                        {
                            "$set" :{
                                "description":rename_data.newContent
                            }
                        }
                    )

                    activity_data={
                        "userId" : rename_data.userId,
                        "groupId" : rename_data.groupId,
                        "activityType" : "GROUP_DESCRIPTION_CHANGE",
                        "fileId" : None,
                        "timestamp":datetime.now(timezone.utc)
                    }

                    await db.activities.insert_one(activity_data)

                    return {"message":"group description changed successfully"}
                except Exception as e:
                    raise HTTPException(status_code=500, detail=str(e))
