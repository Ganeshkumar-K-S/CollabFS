from fastapi import WebSocket, WebSocketDisconnect, APIRouter, HTTPException, Depends, Request
import collections
import json
from app.db.connection import get_db
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorDatabase

load_dotenv()

chat_engine = APIRouter(prefix="/chat")

def verify_chat_api(request: Request):
    expected_key = os.getenv('CHAT_API_KEY')
    request_key = request.headers.get('x-api-key')
    if expected_key != request_key:
        raise HTTPException(
            status_code=403,
            detail="Access Forbidden"
        )

class GroupConnectionManager:
    def __init__(self):
        self.groups = collections.defaultdict(list)
        self.user_info = {}

    async def connect(self, group_id: str, websocket: WebSocket, user_id: str = None, username: str = None):
        await websocket.accept()
        self.groups[group_id].append(websocket)
        connection_key = f"{group_id}_{id(websocket)}"
        self.user_info[connection_key] = {
            "user_id": user_id,
            "username": username,
            "group_id": group_id
        }
        await self.broadcast_online_count(group_id)

    def disconnect(self, group_id: str, websocket: WebSocket):
        if websocket in self.groups[group_id]:
            self.groups[group_id].remove(websocket)
            connection_key = f"{group_id}_{id(websocket)}"
            if connection_key in self.user_info:
                del self.user_info[connection_key]

    async def send_to_group(self, group_id: str, message: dict, exclude_websocket: WebSocket = None):
        message_str = json.dumps(message)
        connections_to_remove = []
        
        print(f"Sending to group {group_id}: {message_str}")
        
        for connection in self.groups[group_id]:
            if exclude_websocket and connection == exclude_websocket:
                continue
                
            try:
                await connection.send_text(message_str)
                print(f"Message sent to connection successfully")
            except Exception as e:
                print(f"Failed to send message to connection: {e}")
                connections_to_remove.append(connection)
        for connection in connections_to_remove:
            self.disconnect(group_id, connection)

    async def broadcast_online_count(self, group_id: str):
        online_count = self.get_active_members(group_id)
        online_message = {
            "type": "online_count",
            "count": online_count,
            "group_id": group_id
        }
        await self.send_to_group(group_id, online_message)

    def get_active_members(self, group_id: str):
        return len(self.groups[group_id])

manager = GroupConnectionManager()

@chat_engine.websocket("/ws/{group_id}")
async def group_chat(
    websocket: WebSocket,
    group_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    user_id = None
    username = None
    
    try:
        await manager.connect(group_id, websocket)
        print(f"WebSocket connected for group {group_id}")
        
        while True:
            data = await websocket.receive_json()
            print(f"Received data: {data}")
            message_type = data.get("type", "message")
            
            if message_type == "identify":
                user_id = data.get("user", "anonymous")
                username = data.get("username", "Anonymous")
                
                print(f"User identified: {username} ({user_id})")
                connection_key = f"{group_id}_{id(websocket)}"
                if connection_key in manager.user_info:
                    manager.user_info[connection_key].update({
                        "user_id": user_id,
                        "username": username
                    })
                await manager.broadcast_online_count(group_id)
                continue
            
            elif message_type == "message":
                user_id = data.get("user", "anonymous")
                username = data.get("username", "Anonymous")
                message = data.get("message", "")
                
                if not message.strip():
                    continue
                
                print(f"Processing message from {username}: {message}")
                
                timestamp = datetime.now(timezone.utc)
                
                chat_doc = {
                    "groupId": group_id,
                    "senderId": user_id,
                    "senderName": username,
                    "message": message,
                    "timestamp": timestamp
                }
                
                result = await db.chat.insert_one(chat_doc)
                print(f"Message saved to DB with ID: {result.inserted_id}")
                broadcast_message = {
                    "type": "message",
                    "id": str(result.inserted_id),
                    "user": user_id,
                    "username": username,
                    "message": message,
                    "timestamp": timestamp.isoformat(),
                    "group_id": group_id
                }
                
                print(f"Broadcasting message to {len(manager.groups[group_id])} connections")
                await manager.send_to_group(group_id, broadcast_message)
                
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for group {group_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        manager.disconnect(group_id, websocket)

        await manager.broadcast_online_count(group_id)
        print(f"Cleaned up connection for group {group_id}")

@chat_engine.get("/history/{group_id}", dependencies=[Depends(verify_chat_api)])
async def get_messages(group_id: str, db=Depends(get_db)):
    try:
        cursor = db.chat.find({"groupId": group_id}).sort("timestamp", -1)
        prev_messages = await cursor.to_list(length=100)

        messages_with_usernames = []
        for msg in reversed(prev_messages):
            sender_id = msg.get("senderId", "anonymous")
            username = msg.get("senderName")
            if not username:
                user_data = await db.user.find_one({"_id": sender_id})
                username = user_data["name"] if user_data else "Anonymous"
            timestamp = msg.get("timestamp")
            if timestamp:
                if isinstance(timestamp, datetime):
                    formatted_ts = timestamp.isoformat()
                else:
                    formatted_ts = timestamp
            else:
                formatted_ts = datetime.now(timezone.utc).isoformat()

            messages_with_usernames.append({
                "id": str(msg.get("_id", "")),
                "user": sender_id,
                "username": username,
                "message": msg.get("message", ""),
                "timestamp": formatted_ts
            })

        return messages_with_usernames

    except Exception as e:
        print(f"Error fetching message history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@chat_engine.get('/onlinemembers/{group_id}', dependencies=[Depends(verify_chat_api)])
def get_online_members(group_id: str):
    online_count = manager.get_active_members(group_id)
    return {"online": online_count, "group_id": group_id}