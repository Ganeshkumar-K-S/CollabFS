from app.db.connection import fs,db
from app.db.collections import files,activities
from fastapi import APIRouter, UploadFile, File, HTTPException,Request,Depends,Form
from app.models.file_model import File as FileModel
from starlette.status import HTTP_403_FORBIDDEN, HTTP_404_NOT_FOUND
from datetime import datetime,timezone
from bson import ObjectId, Int64
from dotenv import load_dotenv
load_dotenv()
import os


file_engine = APIRouter(prefix="/file")

def verify_file_api(request : Request):
    expected_key=os.getenv('FILE_API_KEY')
    key_name="x-api-key"
    response_key=request.headers.get(key_name)
    if expected_key!=response_key:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Unauthorized access"
        )

@file_engine.post("/upload",dependencies=[Depends(verify_file_api)]) 
async def upload_file(request : Request,
                      file: UploadFile = File(...),
                      contentType : str = Form(...)):
    try:
        contents = await file.read()
        file_id = await fs.upload_from_stream(file.filename, contents)
        file_data = {
            "name": f"{file.filename}",
            "uploadedBy": "anonymous",
            "uploadedAt" : datetime.now(timezone.utc),
            "GridFSId" : file_id,
            "size" : Int64(len(contents)),
            "groupId": "tempgroup123",
            "contentType":contentType,
            "pinned":False
        }

        file_id=await db.files.insert_one(file_data)


        activity_data={
            "userId" : "anonymous",
            "groupId" : "tempgroup123",
            "activityType":"FILE_UPLOADED",
            "fileId": file_id.inserted_id,
            "timestamp": datetime.now(timezone.utc)
        }

        await db.activities.insert_one(activity_data)
        
        return {"file_id": str(file_id), "filename": file.filename}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@file_engine.delete("/delete",dependencies=[Depends(verify_file_api)])
async def delete_file(request: Request):
    try:
        data=await request.json()
        print(data)
        file_id=data["file_id"]
        gridfs_id=await db.files.find_one( 
                {
                    "_id": ObjectId(file_id)
                },
                {
                    "_id":0,
                    "GridFSId":1
                } 
            )
        if gridfs_id is None:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND,detail="file not found")
        await fs.delete(gridfs_id['GridFSId'])
        db.files.delete_one({"_id":ObjectId(file_id)})
        activity_data={
            "userId" : "anonymous",
            "groupId" : "tempgroup123",
            "activityType":"FILE_DELETED",
            "fileId": ObjectId(file_id),
            "timestamp": datetime.now(timezone.utc)
        }

        await db.activities.insert_one(activity_data)

        return {"message":f"{file_id} file deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
