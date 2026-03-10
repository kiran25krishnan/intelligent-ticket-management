from fastapi import FastAPI
from app.routes import auth_routes, ticket_routes

app = FastAPI(title="Intelligent Ticket Tracking System")

app.include_router(auth_routes.router)
app.include_router(ticket_routes.router)

@app.get("/")
def home():
    return {"message": "Ticket Tracking API Running"}