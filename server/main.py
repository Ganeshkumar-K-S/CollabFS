from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import os

from app.db.connection import db
from app.routes.file_services import file_engine
from app.routes.chat_services import chat_engine
from app.routes.auth import file_engine as auth_engine
from app.routes.group_services import group_engine
import secrets

app = FastAPI()


# ✅ CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET"))

@app.get('/hello')
def hello_world():
    return {"test_msg": "Hello world!"}

@app.get("/collections")
async def list_collections():
    collection_names = await db.list_collection_names()
    return {"collections": collection_names}

@app.get("/users")
async def list_users():
    users = await db.user.find().to_list(length=None)
    return {"users": users}
# ✅ Include all routers
app.include_router(file_engine)
app.include_router(chat_engine)
app.include_router(auth_engine)
app.include_router(group_engine)
