from fastapi import FastAPI
from app.db.connection import db
from app.routes.file_services import file_engine

app = FastAPI()

@app.get('/hello')
def hello_world():
    return {"test_msg": "Hello world!"}

@app.get("/collections")
async def list_collections():
    collection_names = await db.list_collection_names()
    return {"collections": collection_names}

# ⬇️ Include your file upload router
app.include_router(file_engine)
