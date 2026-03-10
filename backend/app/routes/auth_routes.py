from fastapi import APIRouter
from app.database import users_collection
from app.auth.jwt_handler import create_token

router = APIRouter()

@router.post("/login")
def login(email: str, password: str):

    user = users_collection.find_one({"email": email})

    if not user or user["password"] != password:
        return {"error": "Invalid credentials"}

    token = create_token({"email": email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }