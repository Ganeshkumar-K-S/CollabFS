from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb+srv://collabfs1:qazwsx%40123%21%3F@cluster0.mfrxkra.mongodb.net/?retryWrites=true&w=majority&tls=true&appName=Cluster0"

client = AsyncIOMotorClient(MONGO_URI)
db = client["sample_mflix"]
