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

        cursor = db.users.aggregate(pipeline)
        results = []

        async for doc in cursor:
            results.append({
                "userId": str(doc["_id"]),
                "username": doc["name"]
            })

        return results

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")



