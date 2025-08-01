from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import os

from app.db.connection import db
from app.routes.file_services import file_engine
from app.routes.chat_services import chat_engine
from app.routes.auth import file_engine as auth_engine

app = FastAPI()

# ✅ Add SessionMiddleware (required for request.session in OAuth2)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY", "your-default-secret-key")
)

# ✅ CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/hello')
def hello_world():
    return {"test_msg": "Hello world!"}

@app.get("/collections")
async def list_collections():
    collection_names = await db.list_collection_names()
    return {"collections": collection_names}

# ✅ Include all routers
app.include_router(file_engine)
app.include_router(chat_engine)
app.include_router(auth_engine)
