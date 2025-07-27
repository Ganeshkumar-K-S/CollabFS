from fastapi import FastAPI

app=FastAPI()

@app.get('/hello')
def hello_world():
    return {"test_msg":"Hello world!"}