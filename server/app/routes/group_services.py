from fastapi import APIRouter, Request, HTTPException, Depends
from starlette.status import HTTP_403_FORBIDDEN
from dotenv import load_dotenv
from app.db.connection import get_db 
from app.db.collections import group, groupmembers, activities 
from app.models.group_model import GroupCreateModel, GroupModifyModel, GroupSearchModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import os
from app.utils.group_utils import time_ago

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



@group_engine.get("/search/{user_id}/{name}", dependencies=[Depends(verify_group_api)])
async def search(
    user_id: str,
    name: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                try:
                    if name=="__empty__":
                        name=""
                    cursor=db.groupmembers.aggregate(
                         [
                            {
                                "$match" : {
                                     "userId":user_id
                                }
                            },
                            {
                                "$lookup" : {
                                     "from" : "group",
                                     "localField" : "groupId",
                                     "foreignField" : "_id",
                                     "as" : "rightj"
                                }
                            },
                            {
                                "$unwind": "$rightj"
                            },
                            {
                                 "$match": {
                                      "rightj.gname" :{
                                           "$regex" : name,
                                           "$options" : "i"
                                      }
                                 }
                            }
                         ]
                    )

                    result=await cursor.to_list(length=None)
                    response=[]

                    for doc in result:
                        group_id=doc["groupId"]
                        role=doc["role"]
                        gname=doc["rightj"]["gname"]
                        
                        latest_cursor = db.activities.find(
                            {"groupId": group_id},
                            sort=[("timestamp", -1)],
                            limit=1
                        )

                        latest_list = await latest_cursor.to_list(length=1)
                        latest_date = latest_list[0]["timestamp"] if latest_list else None


                        lastmod=time_ago(latest_date)

                        starred = await db.starred.find_one({
                            "userId":user_id,
                            "groupId":group_id
                        }) is not None

                        response.append(
                             {
                                "groupId":group_id,
                                "groupName":gname,
                                "role":role,
                                "lastModified":lastmod,
                                "starred":starred
                             }
                        )
                    print(response)
                    return response
                        
                except Exception as e:
                     print(e)
                     raise HTTPException(
                          status_code=500,
                          detail=str(e)
                     )

    except Exception as e:
            print(e)
            raise HTTPException(
                status_code=500,
                detail=str(e)
            )
    
@group_engine.get(
     "/userstorage/{user_id}",dependencies=[Depends(verify_group_api)]
    )
async def get_user_storage(
     user_id,
     db : AsyncIOMotorDatabase = Depends(get_db)
):
     try:
          user_data=await db.user.find_one({
               "_id":user_id
          })

          if user_data is None:
               raise HTTPException(
                    status_code=404,
                    detail="user not found"
               )
          return {
               "storageUsed":user_data["storageUsed"]
          }
     except Exception as e:
          raise HTTPException(
               status_code=500,
               detail=str(e)
          )

@group_engine.get("/groupstorage/{user_id}",dependencies=[Depends(verify_group_api)])
async def get_group_storage(
     user_id,
     db : AsyncIOMotorDatabase = Depends(get_db)
):
     try:
          groups_data=db.groupmember.aggregate([
               {
                    "$match":{
                         "userId" : user_id
                    }
               },
               {
                    "$match":{
                         "role" : "Owner"
                    }
               },
               {
                    "$lookup":{
                         "from":"group",
                         "localField":"groupId",
                         "foreignField":"_id",
                         "as":"right"
                    }
               },
               {
                    "$unwind":"right"
               }
          ])

          result=groups_data.to_list(length=None)

          return [
               {
                    "groupId":doc["groupId"],
                    "groupName":doc["right"]["gname"],
                    "storageUsed":doc["storageUsed"]
               }
               for doc in result
          ]
     
     except Exception as e:
          raise HTTPException(
               status_code=500,
               detail=str(e)
          )