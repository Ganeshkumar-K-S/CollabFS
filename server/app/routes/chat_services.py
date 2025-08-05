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
        self.user_info = {}  # Store user info for each connection

    async def connect(self, group_id: str, websocket: WebSocket, user_id: str = None, username: str = None):
        await websocket.accept()
        self.groups[group_id].append(websocket)
        
        # Store user info for this connection
        connection_key = f"{group_id}_{id(websocket)}"
        self.user_info[connection_key] = {
            "user_id": user_id,
            "username": username,
            "group_id": group_id
        }
        
        # Broadcast updated online count
        await self.broadcast_online_count(group_id)

    def disconnect(self, group_id: str, websocket: WebSocket):
        if websocket in self.groups[group_id]:
            self.groups[group_id].remove(websocket)
            
            # Remove user info
            connection_key = f"{group_id}_{id(websocket)}"
            if connection_key in self.user_info:
                del self.user_info[connection_key]

    async def send_to_group(self, group_id: str, message: dict, exclude_websocket: WebSocket = None):
        """Send message to all connections in a group, optionally excluding one"""
        message_str = json.dumps(message)
        connections_to_remove = []
        
        for connection in self.groups[group_id]:
            if exclude_websocket and connection == exclude_websocket:
                continue
                
            try:
                await connection.send_text(message_str)
            except Exception:
                # Connection is closed, mark for removal
                connections_to_remove.append(connection)
        
        # Remove dead connections
        for connection in connections_to_remove:
            self.disconnect(group_id, connection)

    async def broadcast_online_count(self, group_id: str):
        """Broadcast online member count to all group members"""
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
        
        while True:
            data = await websocket.receive_json()
            
            # Handle different message types
            message_type = data.get("type", "message")
            
            if message_type == "identify":
                # Store user identification
                user_id = data.get("user", "anonymous")
                username = data.get("username", "Anonymous")
                
                # Update connection with user info
                connection_key = f"{group_id}_{id(websocket)}"
                if connection_key in manager.user_info:
                    manager.user_info[connection_key].update({
                        "user_id": user_id,
                        "username": username
                    })
                
                # Send online count update
                await manager.broadcast_online_count(group_id)
                continue
            
            elif message_type == "message":
                user_id = data.get("user", "anonymous")
                username = data.get("username", "Anonymous")
                message = data.get("message", "")
                
                if not message.strip():
                    continue
                
                # Create timestamp in ISO format
                timestamp = datetime.now(timezone.utc)
                
                # Save to database
                chat_doc = {
                    "groupId": group_id,
                    "senderId": user_id,
                    "senderName": username,  # Store username directly
                    "message": message,
                    "timestamp": timestamp
                }
                
                result = await db.chat.insert_one(chat_doc)
                
                # Create message for broadcasting
                broadcast_message = {
                    "type": "message",
                    "id": str(result.inserted_id),
                    "user": user_id,
                    "username": username,
                    "message": message,
                    "timestamp": timestamp.isoformat(),
                    "group_id": group_id
                }
                
                # Broadcast to all group members except sender
                await manager.send_to_group(group_id, broadcast_message, exclude_websocket=websocket)
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        manager.disconnect(group_id, websocket)
        # Broadcast updated online count after disconnect
        await manager.broadcast_online_count(group_id)

@chat_engine.get("/history/{group_id}", dependencies=[Depends(verify_chat_api)])
async def get_messages(group_id: str, db=Depends(get_db)):
    try:
        # Get the last 100 messages sorted by latest first
        cursor = db.chat.find({"groupId": group_id}).sort("timestamp", -1)
        prev_messages = await cursor.to_list(length=100)

        messages_with_usernames = []
        for msg in reversed(prev_messages):  # Reverse to show oldest first
            sender_id = msg.get("senderId", "anonymous")
            
            # Try to get username from message first (if stored), then from user collection
            username = msg.get("senderName")
            if not username:
                user_data = await db.user.find_one({"_id": sender_id})
                username = user_data["name"] if user_data else "Anonymous"

            # Use ISO timestamp format for consistency
            timestamp = msg.get("timestamp")
            if timestamp:
                # Ensure it's a datetime object and convert to ISO format
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