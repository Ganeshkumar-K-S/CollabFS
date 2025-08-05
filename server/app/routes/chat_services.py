from fastapi import WebSocket, WebSocketDisconnect, APIRouter, HTTPException, Depends, Request
import collections
from app.db.connection import get_db
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
load_dotenv()

chat_engine = APIRouter(prefix="/chat")


def verify_chat_api(request : Request):
    expected_key=os.env.get('CHAT_API_KEY')
    request_key=request.get('x-api-key')
    if expected_key != request_key:
        raise HTTPException(
            status_code=403,
            detail="Access Forbidden"
        )

class GroupConnectionManager:
    def __init__(self):
        self.groups = collections.defaultdict(list)

    async def connect(self, group_id, websocket: WebSocket):
        await websocket.accept()
        self.groups[group_id].append(websocket)

    def disconnect(self, group_id, websocket: WebSocket):
        self.groups[group_id].remove(websocket)

    async def send_to_group(self, group_id, message: str):
        for connection in self.groups[group_id]:
            await connection.send_text(message)

    def get_active_members(self,group_id):
        return len(self.groups[group_id])


manager = GroupConnectionManager()


@chat_engine.websocket("/ws/{group_id}",dependencies=[Depends(verify_chat_api)])
async def group_chat(websocket: WebSocket, group_id: str, db=Depends(get_db)):
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
            await manager.send_to_group(group_id, f"{user}: {message}")

    except WebSocketDisconnect:
        manager.disconnect(group_id, websocket)


@chat_engine.get("/history/{group_id}",dependencies=[Depends(verify_chat_api)])
async def get_messages(group_id: str, db=Depends(get_db)):
    try:
        # Get the last 100 messages sorted by latest first
        cursor = db.chat.find({"groupId": group_id}).sort("timestamp", -1)
        prev_messages = await cursor.to_list(length=100)

        messages_with_usernames = []
        for msg in reversed(prev_messages):
            sender_id = msg.get("senderId", "anonymous")

            # Lookup username from user collection
            user_data = await db.user.find_one({"_id": sender_id})
            username = user_data["name"] if user_data else "anonymous"

            # Format timestamp (UTC)
            ts = msg.get("timestamp")
            formatted_ts = ts.astimezone(timezone.utc).strftime("%b %d %Y %H:%M") if ts else ""

            messages_with_usernames.append({
                "user": sender_id,
                "username": username,
                "message": msg.get("message", ""),
                "timestamp": formatted_ts
            })

        return messages_with_usernames

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@chat_engine.get('/onlinemembers/{group_id}',dependencies=[Depends(verify_chat_api)])
def get_online_members(group_id):
    return manager.get_active_members(group_id)