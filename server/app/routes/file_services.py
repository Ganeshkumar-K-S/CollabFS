from app.db.connection import get_db,get_fs
from app.db.collections import files,activities
from fastapi import APIRouter, UploadFile, File, HTTPException,Request,Depends,Form
from fastapi.responses import StreamingResponse
from io import BytesIO
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
async def upload_file(
                      file: UploadFile = File(...),
                      contentType : str = Form(...),
                      db = Depends(get_db),
                      fs = Depends(get_fs)
                      ):
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
async def delete_file(
                    request: Request,
                    db = Depends(get_db),
                    fs = Depends(get_fs)
                    ):
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

@file_engine.get("/download/{file_id}")
async def download_file(
                file_id,
                request: Request,
                db=Depends(get_db),
                fs=Depends(get_fs)
            ):
    try:
        file_data = await db.files.find_one({'_id': ObjectId(file_id)})

        if file_data is None:
            print("It is none")
            raise HTTPException(status_code=404, detail="File data not found")

        gridfs_id = file_data['GridFSId']
        content_type = file_data['contentType']
        print(file_data)
        filename =file_data['name']
        print(filename)

        grid_out = await fs.open_download_stream(gridfs_id)
        file_content = await grid_out.read()

        return StreamingResponse(
            BytesIO(file_content),
            status_code=200,
            media_type=content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )

    except Exception as e:
        print(e)
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





    

    

