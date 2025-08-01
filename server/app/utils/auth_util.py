from app.db.connection import db
import random
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv
import os
from datetime import datetime,timezone,timedelta

load_dotenv()

bcrypt_context=CryptContext(schemes=["bcrypt"],deprecated="auto")

import random

async def generate_userid(username: str, db):
    base = username.lower().replace(" ", "_")

    while True:
        random_number = str(random.randint(10000, 99999))
        tempname = base + random_number
        existing = await db.user.find_one({"_id": tempname})
        if not existing:
            return tempname


def verify_password(plain_pwd, hashed_pwd):
    return bcrypt_context.verify(plain_pwd, hashed_pwd)

def get_password_hash(password):
    return bcrypt_context.hash(password)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
EXPIRES_TIME = 60

def generate_token(user):
    to_encode=user.copy()
    expiry_time=datetime.now(timezone.utc)+ (timedelta(minutes=EXPIRES_TIME))
    to_encode["exp"]=expiry_time
    encoded_jwt=jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token:str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def generate_otp():
    return str(random.randint(100000, 999999))