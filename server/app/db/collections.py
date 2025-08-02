from app.db.connection import db

users = db["user"]
files= db["files"]
activities = db["activities"]
chat = db["chat"]
group = db["group"]
groupmembers=db["groupMembers"]