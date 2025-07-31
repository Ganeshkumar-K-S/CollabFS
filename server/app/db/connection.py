import asyncio
from motor.motor_asyncio import AsyncIOMotorClient,AsyncIOMotorGridFSBucket
from dotenv import load_dotenv
import os
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGO_DB_NAME")
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
fs=AsyncIOMotorGridFSBucket(db)


def get_db():
    return db

def get_fs():
    return fs
