from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel
from passlib.context import CryptContext
from app.db.connection import db
import app.utils.auth_util as auth_util
from app.models.user_models import User
from datetime import datetime,timezone

app=FastAPI()

class LoginModel(BaseModel):
    username:str
    pwd:str

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

    token=auth_util.generate_token(user.id,user.name,user.email)
    


