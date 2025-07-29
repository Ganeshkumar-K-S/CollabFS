from app.db.connection import db
import random
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv
import os

load_dotenv()

bcrypt_context=CryptContext(schemes=["bcrypt"],deprecated="auto")

def generate_userid(username:str):
    base=username.lower().replace(" ","_")

    while True:
        random_number=str(random.randint(10000,99999))
        tempname=base+random_number
        if not db.users.find_one({"_id":tempname}):
            return tempname

def verify_password(plain_pwd, hashed_pwd):
    return bcrypt_context.verify(plain_pwd, hashed_pwd)

def get_password_hash(password):
    return bcrypt_context.hash(password)

def generate_token(id:str,name:str,email:str):
