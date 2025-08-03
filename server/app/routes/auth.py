from fastapi import FastAPI, Depends, HTTPException, status,Request,APIRouter,BackgroundTasks, Response
from pydantic import BaseModel, EmailStr
from starlette.status import HTTP_403_FORBIDDEN
from passlib.context import CryptContext
from app.db.connection import db
import app.utils.auth_util as auth_util
from app.models.user_models import User
from datetime import datetime,timezone
import os
from fastapi_mail import FastMail,MessageSchema,ConnectionConfig
from app.db.connection import db
from pathlib import Path
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from urllib.parse import urlencode
from fastapi.responses import RedirectResponse
import warnings
warnings.filterwarnings("ignore", message="Valid config keys have changed in V2")

file_engine = APIRouter(prefix="/auth")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
mail_config = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT")),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS") == "True",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS") == "True",
    USE_CREDENTIALS=os.getenv("USE_CREDENTIALS") == "True",
    VALIDATE_CERTS=os.getenv("VALIDATE_CERTS") == "True",
    TEMPLATE_FOLDER=Path(__file__).resolve().parent.parent / os.getenv("TEMPLATE_FOLDER")
)

oauth = OAuth()
config = Config(environ=os.environ)
oauth = OAuth(config)

oauth.register(
    name='google',
    client_id="791201826131-0gdatqsmc0i8gdjghquh2o0o9huenopp.apps.googleusercontent.com",
    client_secret='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',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

class LoginModel(BaseModel):
    email: str
    pwd: str

class SignupModel(BaseModel):
    email: str
    username: str
    pwd: str

class UserModel(BaseModel):
    email: str
    username: str
    pwd: str
    otp: str

def verify_auth_api(request : Request):
    expected_key=os.getenv('AUTH_API_KEY')
    key_name = "x-api-key"
    response_key = request.headers.get(key_name)
    if expected_key != response_key:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Unauthorized access"
        )

@file_engine.post("/email/signup", dependencies=[Depends(verify_auth_api)])
async def signup_api(response: SignupModel):
    try:
        email = response.email
        username = response.username
        existing_user = await db.user.find_one({"email": email})
        print(f"Existing user: {existing_user}")
        if existing_user:
            return {
                "success": False,
                "message": "User already found"
            }
        return {
            "success": True,
            "session_details": {
                "email": response.email,
                "username": response.username,
                "hashed_password": auth_util.get_password_hash(response.pwd)
            }
        }
    except Exception as e:
        print(f"Error during signup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid user data"
        )
        
@file_engine.post("/email/signup/sendotp",dependencies=[Depends(verify_auth_api)])
async def sendotp_api(email:str):
    otp=auth_util.generate_otp()
    await db.otp_store.update_one(
            {"email": email}, 
            {
                "$set": {
                    "otp": otp,
                    "createdAt": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
    now=datetime.now()
    
    message = MessageSchema(
        subject="Your OTP Code",
        recipients=[email],
        template_body={"otp": otp,"purpose":"To complete your signup","date":now.strftime("%d-%B-%Y")},
        subtype="html"
    )
    fm = FastMail(mail_config)
    fm.send_message(message, template_name="otp_template.html")
    return {"message": "OTP sent successfully"}


@file_engine.post("/email/setuserid", dependencies=[Depends(verify_auth_api)])
async def setuserid_api(request: UserModel):
    try:
        otp_entry = await db.otp_store.find_one({"email": request.email, "otp": request.otp})

        if not otp_entry:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid OTP or email mismatch"
            )
        
        expiry_minutes = 10
        if (datetime.now(timezone.utc) - otp_entry["createdAt"]).total_seconds() > expiry_minutes * 60:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OTP expired"
            )

        user_id = auth_util.generate_userid(request.username)
        
        await db.user.insert_one({
            "_id": user_id,
            "name": request.username,
            "pwd": request.pwd,
            "email": request.email,
            "createdAt": datetime.now(timezone.utc),
            "lastAccessed": datetime.now(timezone.utc)
        })

        token = auth_util.generate_token({
            "id": user_id,
            "name": request.username,
            "email": request.email
        })

        session_credentials = {
            "username": request.username,
            "email": request.email
        }

        await db.otp_store.delete_one({"email": request.email, "otp": request.otp})

        return {
            "success": True,
            "token": token,
            "session_details": session_credentials
        }

    except HTTPException as he:
        raise he

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"User registration failed: {str(e)}"
        )


@file_engine.post("/email/login", dependencies=[Depends(verify_auth_api)])
async def login_api(request: LoginModel):
    try:
        user_doc = await db.user.find_one({"email": request.email})
        if not user_doc:
            return {"success": False, "message": "User not found"}
        
        user = User(**user_doc)
        
        await db.user.update_one(
            {"_id": user.id},
            {"$set": {"lastAccessed": datetime.now(timezone.utc)}}
        )
        
        print(auth_util.get_password_hash(request.pwd))
        is_password_valid = auth_util.verify_password(request.pwd, user.pwd)
        
        if not is_password_valid:
            return {"success": False, "message": "Password does not match"}
        
        print("Generating token...")
        # Make sure this function only returns a string
        token = auth_util.generate_token({
            "id": user.id,
            "name": user.name,
            "email": user.email
        })
        
        return {
            "success": True,
            "token": token,
            "session_details": {
                "id": user.id,
                "username": user.name,
                "email": user.email
            }
        }
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@file_engine.get('/auth')
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        print("Token:", token)
        user_info = token.get("userinfo")
        if not user_info:
            raise HTTPException(status_code=400, detail="User info not found in token")

        email = user_info.get("email")
        username = user_info.get("name")

        user_doc = await db.user.find_one({"email": email})
        if user_doc is None:
            user_id = await auth_util.generate_userid(username, db)
            print(user_id)
            await db.user.insert_one({
                "_id": user_id,
                "name": username,
                "email": email,
                "pwd": "",
                "createAt": datetime.now(timezone.utc),
                "lastAccessed": datetime.now(timezone.utc),
                "storageUsed": 0
            })
        else:
            user_id = user_doc["_id"]
            await db.user.update_one(
                {"_id": user_id},
                {"$set": {"lastAccessed": datetime.now(timezone.utc)}}
            )

        jwt_token = auth_util.generate_token({
            "id": user_id,
            "name": username,
            "email": email,
        })

        # Construct redirect URL to frontend with token and user info
        query_params = urlencode({
            "token": jwt_token,
            "id": user_id,
            "email": email,
            "username": username
        })
        redirect_url = f"{FRONTEND_URL}/auth?{query_params}"
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        print("Google Auth Failed:", str(e))
        error_params = urlencode({
            "error": "auth_failed",
            "message": str(e)
        })
        redirect_url = f"{FRONTEND_URL}/auth/error?{error_params}"
        return RedirectResponse(url=redirect_url)

@file_engine.get("/login")
async def login_via_google(request: Request):
    redirect_uri = str(request.url_for("auth"))
    print("Redirect URI:", redirect_uri)
    return await oauth.google.authorize_redirect(request, redirect_uri)
