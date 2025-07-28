from app.db.connection import fs
from fastapi import APIRouter, UploadFile, File, HTTPException,Request
from bson import ObjectId

file_engine = APIRouter(prefix="/file")

@file_engine.post("/upload") 
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        file_id = await fs.upload_from_stream(file.filename, contents)
        return {"file_id": str(file_id), "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@file_engine.delete("/delete")
async def delete_file(request: Request):
    try:
        data=await request.json()
        file_id=data["file_id"]
        await fs.delete(ObjectId(file_id))
        return {"message":f"{file_id} file deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
