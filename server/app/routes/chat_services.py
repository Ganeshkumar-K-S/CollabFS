from fastapi import WebSocket, WebSocketDisconnect, APIRouter, HTTPException, Depends
import collections
from app.db.connection import get_db
from datetime import datetime, timezone

chat_engine = APIRouter(prefix="/chat")

class GroupConnectionManager:
    def __init__(self):
        self.groups = collections.defaultdict(list)

    async def connect(self, group_id, websocket):
        await websocket.accept()
        self.groups[group_id].append(websocket)

    def disconnect(self, group_id, websocket):
        self.groups[group_id].remove(websocket)

    async def sent_to_group(self, group_id, message):
        for connection in self.groups[group_id]:
            await connection.send_text(message)

manager = GroupConnectionManager()

@chat_engine.websocket("/ws/{group_id}")
async def group_chat(websocket: WebSocket, group_id: str,db = Depends(get_db)):
    await manager.connect(group_id, websocket)

    try:
        while True:
            data = await websocket.receive_json() 

            user = data.get("user", "anonymous")
            message = data.get("message", "")
            if not message:
                continue

            chat_doc = {
                "groupId": group_id,
                "senderId": user,
                "message": message,
                "timestamp": datetime.now(timezone.utc)
            }
            await db.chat.insert_one(chat_doc)
            await manager.sent_to_group(group_id, f"{user}: {message}")

    except WebSocketDisconnect:
        manager.disconnect(group_id, websocket)

@chat_engine.get("/history/{group_id}")
async def get_messages(group_id: str,db = Depends(get_db)):
    try:
        cursor = db.chat.find({"groupId": group_id}).sort("timestamp", -1)
        prev_messages = await cursor.to_list(length=100)

        return [
            {
                "user": msg.get("senderId", "anonymous"),
                "message": msg.get("message", ""),
                "timestamp": msg.get("timestamp")
            }
            for msg in reversed(prev_messages)
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
