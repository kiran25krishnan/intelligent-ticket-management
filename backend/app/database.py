from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")

db = client["ticket_system"]

users_collection = db["users"]
tickets_collection = db["tickets"]