from pydantic import BaseModel, EmailStr
from app.db.connection import db
from datetime import datetime,timezone
import os
from app.db.connection import db
import warnings
from bson import Int64
from fastapi import APIRouter,Request,HTTPException,Depends
from app.models.group_members_model import addUserModel
from starlette.status import HTTP_403_FORBIDDEN
from app.db.connection import get_db
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

file_engine = APIRouter(prefix="/user")

def verify_userservices_api(request: Request):
    expected_key = os.getenv('USERSERVICES_API_KEY')
    key_name = "x-api-key"
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

