from app.db.connection import fs
from fastapi import APIRouter, UploadFile, File, HTTPException,Request,Depends
from starlette.status import HTTP_403_FORBIDDEN
from bson import ObjectId
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
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        file_id = await fs.upload_from_stream(file.filename, contents)
        return {"file_id": str(file_id), "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@file_engine.delete("/delete",dependencies=[Depends(verify_file_api)])
async def delete_file(request: Request):
    try:
        data=await request.json()
        file_id=data["file_id"]
        await fs.delete(ObjectId(file_id))
        return {"message":f"{file_id} file deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
