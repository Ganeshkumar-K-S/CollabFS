from fastapi import FastAPI
from app.db.connection import db
app=FastAPI()

@app.get('/hello')
def hello_world():
    return {"test_msg":"Hello world!"}

@app.get("/collections")
async def list_collections():
    collection_names = await db.list_collection_names()
    print(collection_names)