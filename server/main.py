from fastapi import FastAPI, HTTPException
from dbconnection import db

app = FastAPI()

def convert_objectid(document):
    document["_id"] = str(document["_id"])
    return document

@app.get("/users")
async def get_users():
    try:
        cursor = db["users"].find()
        users = []
        async for doc in cursor:
            users.append(convert_objectid(doc))
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
