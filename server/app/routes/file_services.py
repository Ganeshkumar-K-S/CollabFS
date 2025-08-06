from app.db.connection import get_db,get_fs
from app.db.collections import files,activities
from fastapi import APIRouter, UploadFile, File, HTTPException,Request,Depends,Form
from fastapi.responses import StreamingResponse
from io import BytesIO
from app.models.file_model import File as FileModel, FileAccess
from starlette.status import HTTP_403_FORBIDDEN, HTTP_404_NOT_FOUND
from datetime import datetime,timezone
from bson import ObjectId, Int64
from dotenv import load_dotenv
load_dotenv()
import os
from app.utils.auth_util import verify_role

file_engine = APIRouter(prefix="/file")

def verify_file_api(request : Request):
    expected_key=os.getenv('FILE_API_KEY')
    key_name="x-api-key"
    response_key=request.headers.get(key_name)
    print(f"Expected API key: {expected_key} | Received API key: {response_key} Matching : {expected_key == response_key}")
    if expected_key!=response_key:
        print("HERE")
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Unauthorized access"
        )

@file_engine.post("/upload", dependencies=[Depends(verify_file_api)]) 
async def upload_file(
    file: UploadFile = File(...),
    contentType: str = Form(...),
    userId: str = Form(...),
    groupId: str = Form(...),
    db = Depends(get_db),
    fs = Depends(get_fs)
):
    # Role check first
    print(f"User ID: {userId}, Group ID: {groupId}, Content Type: {contentType}")
    await verify_role(user_id=userId, group_id=groupId, roles={"owner", "admin", "editor"})

    async with await db.client.start_session() as session:
        async with session.start_transaction():
            try:
                contents = await file.read()
                file_id = await fs.upload_from_stream(file.filename, contents)

                file_size = Int64(len(contents))

                # Insert file metadata
                file_data = {
                    "name": file.filename,
                    "uploadedBy": userId,
                    "uploadedAt": datetime.now(timezone.utc),
                    "GridFSId": file_id,
                    "size": file_size,
                    "groupId": groupId,
                    "contentType": contentType,
                    "pinned": False
                }

                insert_result = await db.files.insert_one(file_data, session=session)

                owner_doc = await db.groupMembers.find_one(
                    {"groupId": groupId, "role": "owner"},
                    {"_id": 0, "userId": 1},
                    session=session
                )

                if owner_doc is not None:
                    await db.user.update_one(
                        {"_id": owner_doc["userId"]},
                        {"$inc": {"storageUsed": file_size}},
                        session=session
                    )

                await db.group.update_one(
                    {"_id": groupId},
                    {"$inc": {"storageUsed": file_size}},
                    session=session
                )

                activity_data = {
                    "userId": userId,
                    "groupId": groupId,
                    "activityType": "FILE_UPLOADED",
                    "fileId": insert_result.inserted_id,
                    "timestamp": datetime.now(timezone.utc)
                }

                await db.activities.insert_one(activity_data, session=session)

                return {
                    "file_id": str(insert_result.inserted_id),
                    "filename": file.filename,
                    "size": file_size
                }

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@file_engine.delete("/delete", dependencies=[Depends(verify_file_api)])
async def delete_file(
    data: FileAccess,
    db=Depends(get_db),
    fs=Depends(get_fs)
):
    async with await db.client.start_session() as session:
        async with session.start_transaction():
            try:
                file_id = data.fileId

                filedata = await db.files.find_one(
                    {"_id": ObjectId(file_id)},
                    {"GridFSId": 1, "groupId": 1, "size": 1},
                    session=session
                )

                if not filedata or not filedata.get("GridFSId"):
                    raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="File not found")

                # Verify permission
                await verify_role(
                    user_id=data.userId,
                    group_id=filedata["groupId"],
                    roles={"owner", "admin", "editor"}
                )

                # Get Owner's userId for decrement
                owner_doc = await db.groupMembers.find_one(
                    {"groupId": filedata["groupId"], "role": "owner"},
                    {"_id": 0, "userId": 1},
                    session=session
                )

                if owner_doc is None:
                    raise HTTPException(status_code=404, detail="Owner user not found")

                owner_id = owner_doc["userId"]

                # Decrement storage usage
                await db.user.update_one(
                    {"_id": owner_id},
                    {"$inc": {"storageUsed": -filedata["size"]}},
                    session=session
                )

                await db.group.update_one(
                    {"_id": filedata["groupId"]},
                    {"$inc": {"storageUsed": -filedata["size"]}},
                    session=session
                )

                # Delete file from GridFS and DB
                await fs.delete(filedata["GridFSId"])
                await db.files.delete_one({"_id": ObjectId(file_id)}, session=session)

                # Log activity
                activity_data = {
                    "userId": data.userId,
                    "groupId": filedata["groupId"],
                    "activityType": "FILE_DELETED",
                    "fileId": ObjectId(file_id),
                    "timestamp": datetime.now(timezone.utc)
                }

                await db.activities.insert_one(activity_data, session=session)

                return {"message": f"{file_id} file deleted successfully"}

            except Exception as e:
                print(e)
                raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

@file_engine.post("/download")
async def download_file(
    data: FileAccess,
    request: Request,
    db=Depends(get_db),
    fs=Depends(get_fs)
):
    try:
        file_id = data.fileId
        file_data = await db.files.find_one({'_id': ObjectId(file_id)})

        if file_data is None:
            raise HTTPException(status_code=404, detail="File data not found")
        
        await verify_role(
                    user_id=data.userId,
                    group_id=file_data["groupId"],
                    roles={"owner","admin","editor","viewer"}
                )

        gridfs_id = file_data['GridFSId']
        content_type = file_data['contentType']
        filename = file_data['name']

        grid_out = await fs.open_download_stream(gridfs_id)
        file_content = await grid_out.read()

        activity_data = {
            "userId": data.userId,
            "groupId": file_data["groupId"],
            "activityType": "FILE_DOWNLOADED",
            "fileId": ObjectId(file_id),
            "timestamp": datetime.now(timezone.utc)
        }

        await db.activities.insert_one(activity_data)

        return StreamingResponse(
            BytesIO(file_content),
            status_code=200,
            media_type=content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@file_engine.get("/search/{filename}",dependencies=[Depends(verify_file_api)])
async def search_file(
    filename,
    db=Depends(get_db)
    ):

    match=db.files.find({
        "name" : {
            "$regex" : f"{filename}",
            "$options" : "i"
        }
    })

    result=await match.to_list(length=None)
    return [
        {
            "file_id":str(doc["_id"]),
            "name":doc["name"]
        }
        for doc in result
    ]


@file_engine.get("/{group_id}",dependencies=[Depends(verify_file_api)])
async def get_all_files(
    group_id,
    db=Depends(get_db)
    ):

    try:
        cursor=db.files.find({"groupId" : f"{group_id}"})
        if cursor is None:
            return []
        matchfiles=await cursor.to_list(length=None)

        return [
            {
                "file_id" : str(doc["_id"]),
                "name" : doc["name"],
                "contentType" : doc["contentType"],
                "size" : doc["size"],
                "pinned" : doc["pinned"],
                "uploadedAt" : doc["uploadedAt"],
                "uploadedBy" : doc["uploadedBy"]
            }
            for doc in matchfiles
        ]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@file_engine.get("/{group_id}",dependencies=[Depends(verify_file_api)])
async def pin_file(request: FileAccess, db = Depends(get_db)):
    try:
        file_obj_id = ObjectId(request.fileId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid fileId format")

    result = await db.files.update_one(
        {"_id": file_obj_id},
        {"$set": {"pinned": True}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    if result.modified_count == 0:
        return {"message": "File was already pinned"}

    return {"message": "File pinned successfully"}