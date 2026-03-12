from pymongo import MongoClient

# Change localhost to "mongo" — that's the Docker container name
client = MongoClient("mongodb://mongo:27017")

db = client["ticket_system"]
users_collection = db["users"]
tickets_collection = db["tickets"]