from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_routes, ticket_routes,admin_routes

app = FastAPI(title="Intelligent Ticket Tracking System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(ticket_routes.router)
app.include_router(admin_routes.router)

@app.get("/")
def home():
    return {"message": "Ticket Tracking API Running"}