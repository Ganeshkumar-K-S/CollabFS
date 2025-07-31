from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.connection import db
from app.routes.file_services import file_engine
from app.routes.chat_services import chat_engine

app = FastAPI()
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

app.include_router(file_engine)
app.include_router(chat_engine)
