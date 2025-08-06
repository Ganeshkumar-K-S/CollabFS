from pydantic import BaseModel, EmailStr
from app.db.connection import db
from datetime import datetime,timezone
import os
from app.db.connection import db
import warnings
from bson import Int64
from fastapi import APIRouter,Request,HTTPException,Depends, Query
from app.models.group_members_model import addUserModel,exitGroupModel,removeUserModel
from starlette.status import HTTP_403_FORBIDDEN
from app.db.connection import get_db
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from app.utils.auth_util import verify_role

file_engine = APIRouter(prefix="/user")

def verify_userservices_api(request: Request):
    expected_key = os.getenv('USERSERVICES_API_KEY')
    key_name = "x-api-key"
    print(f"Expected API key: {expected_key} | Received API key: {request.headers.get(key_name)}")
    response_key = request.headers.get(key_name)
    if expected_key != response_key:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Unauthorized access"
        )

@file_engine.get("/searchuser/{username}", dependencies=[Depends(verify_userservices_api)])
async def search_user(username: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        pipeline = [
            {
                "$match": {
                    "name": {"$regex": username, "$options": "i"}
                }
            },
            {
                "$addFields": {
                    "score": {
                        "$cond": [
                            { "$regexMatch": {
                                "input": "$name",
                                "regex": f"^{username}",
                                "options": "i"
                            }},
                            2,
                            1
                        ]
                    }
                }
            },
            {
                "$sort": {"score": -1}
            },
            {
                "$limit": 10
            },
            {
                "$project": {
                    "_id": 1,
                    "name": 1
                }
            }
        ]

        cursor = db.user.aggregate(pipeline)
        results = []

        async for doc in cursor:
            results.append({
                "userId": doc["_id"],
                "username": doc["name"]
            })

        return results

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")

@file_engine.post("/adduser", dependencies=[Depends(verify_userservices_api)])
async def add_user(
    users: List[addUserModel], 
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        user_docs = [user.model_dump() for user in users]

        async with await db.client.start_session() as session:
            async with session.start_transaction():
                for doc in user_docs:
                    userId = doc["userId"]
                    groupId = doc["groupId"]
                    role = doc["role"]
                    
                    await db.groupMembers.insert_one(
                        {
                            "userId": userId,
                            "groupId": groupId,
                            "role": role,
                            "joinedAt": datetime.now(timezone.utc)
                        },
                        session=session
                    )

        return {"message": "Inserted successfully"}

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")  

# CORRECTED: Added Query parameter for groupId
@file_engine.get("/displayuser", dependencies=[Depends(verify_userservices_api)])
async def display_user(
    groupId: str = Query(..., description="Group ID to fetch users for"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                pipeline=[
                    {
                        "$match":{
                            "groupId":groupId
                        }
                    },
                    {
                        "$lookup":{
                            "from": "user",
                            "localField": "userId",
                            "foreignField": "_id",  # CORRECTED: Should match _id field
                            "as": "userDetails"
                        }
                    },
                    {"$unwind": "$userDetails"} ,

                    {
                        "$project":{
                            "_id":"$userDetails._id",
                            "name":"$userDetails.name",
                            "email":"$userDetails.email",
                            "role":"$role"
                        }
                    }
                ]

                cursor = db.groupMembers.aggregate(pipeline)
                results = await cursor.to_list(length=None)
        return results

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error") 


@file_engine.post("/deletegroup",dependencies=[Depends(verify_userservices_api)])
async def delete_group(request:exitGroupModel,
                     db:AsyncIOMotorDatabase=Depends(get_db)
):
    groupId=request.groupId
    userId=request.userId
    try:
        await verify_role(
                    user_id=userId,
                    group_id=groupId,
                    roles={"owner"}
                    )
        
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                await db.chat.delete_many({"groupId":groupId},session=session)
                await db.files.delete_many({"groupId":groupId},session=session)
                await db.groupMembers.delete_many({"groupId":groupId},session=session)
                await db.starred.delete_many({"groupId":groupId},session=session)
                await db.activities.insert_one({
                    "userId":userId,
                    "groupId":groupId,
                    "activityType":"Group deleted",
                    "fileId":None,
                    "timestamp":datetime.now(timezone.utc)
                },
                session=session
                )
        
        return {"message":"deletion successful"}
    

    except Exception as e:
        print(f"Error deleting group: {e}")
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")
                    
@file_engine.post("/exitgroup",dependencies=[Depends(verify_userservices_api)])
async def exit_group(request:exitGroupModel,
                     db:AsyncIOMotorDatabase=Depends(get_db)
):
    groupId=request.groupId
    userId=request.userId
    try:
        if request.role!="owner":
            async with await db.client.start_session() as session:
                async with session.start_transaction():
                    await db.groupMembers.delete_many(
                        {
                        "groupId":groupId,
                        "userId":userId
                        },
                        session=session)
                    await db.activities.insert_one({
                        "userId":userId,
                        "groupId":groupId,
                        "activityType":"Exited from group",
                        "fileId":None,
                        "timestamp":datetime.now(timezone.utc)
                        },
                        session=session
                        )
            return {"message":"group exited successfully"}
        else:
            async with await db.client.start_session() as session:
                async with session.start_transaction():
                    await db.groupMembers.delete_many({"groupId": groupId}, session=session)
                    await db.groups.delete_one({"_id": groupId}, session=session)
                    await db.activities.insert_one(
                        {
                            "userId": userId,
                            "groupId": groupId,
                            "activityType": "Group deleted by owner",
                            "fileId": None,
                            "timestamp": datetime.now(timezone.utc)
                        },
                        session=session
                    )
            return {"message": "Group deleted successfully because owner exited"}
    except Exception as e:
                raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

@file_engine.post("/removeuser", dependencies=[Depends(verify_userservices_api)])
async def remove_user_from_group(
    request: exitGroupModel,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    groupId = request.groupId
    userId = request.userId
    role = request.role
    
    try:
        # Check if user exists in the group
        existing_member = await db.groupMembers.find_one({
            "groupId": groupId,
            "userId": userId
        })
        
        if not existing_member:
            raise HTTPException(
                status_code=404, 
                detail="User not found in this group"
            )
        
        # Prevent owner from being removed
        if existing_member.get("role", "").lower() == "owner":
            raise HTTPException(
                status_code=403,
                detail="Cannot remove group owner"
            )
        
        # Remove user from group
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                result = await db.groupMembers.delete_one(
                    {
                        "groupId": groupId,
                        "userId": userId
                    },
                    session=session
                )
                
                if result.deleted_count == 0:
                    raise HTTPException(
                        status_code=404,
                        detail="User not found in group"
                    )
                
                # Log the activity
                await db.activities.insert_one({
                    "userId": userId,
                    "groupId": groupId,
                    "activityType": "Removed from group",
                    "fileId": None,
                    "timestamp": datetime.now(timezone.utc)
                }, session=session)
        
        return {"message": "User removed from group successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error removing user: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to remove user: {str(e)}"
        )