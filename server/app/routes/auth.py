from fastapi import FastAPI, Depends, HTTPException, status,Request,APIRouter
from pydantic import BaseModel
from starlette.status import HTTP_403_FORBIDDEN
from passlib.context import CryptContext
from app.db.connection import db
import app.utils.auth_util as auth_util
from app.models.user_models import User
from datetime import datetime,timezone
import os

file_engine = APIRouter(prefix="/auth")

class LoginModel(BaseModel):
    username:str
    pwd:str

def verify_auth_api(request : Request):
    expected_key=os.getenv('AUTH_API_KEY')
    key_name="x-api-key"
    response_key=request.headers.get(key_name)
    if expected_key!=response_key:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Unauthorized access"
        )

@file_engine.post("/login",dependencies=[Depends(verify_auth_api)]) 
async def login_api(request:LoginModel):
    user_doc = await db.user.find_one({"name": request.username})
    if not user_doc:
        return {"success": False, "message": "User not found"}
    
    try:
        user = User(**user_doc)   
    except Exception as e:
         raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid user data format"
        )
         
    await db.user.update_one(
        {"_id": user.id},
        {"$set": {"lastAccessed": datetime.now(timezone.utc)}}
    )
    
    if not auth_util.verify_password(request.pwd,user.pwd):
            return {"success": False, "message": "Password does not match"}

    token=auth_util.generate_token({"id":user.id,"name":user.name,"email":user.email})

    return token
    


