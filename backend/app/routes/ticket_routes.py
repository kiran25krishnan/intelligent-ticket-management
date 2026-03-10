from fastapi import APIRouter
from app.models.ticket_model import Ticket
from app.database import tickets_collection
from app.services.classifier_service import classify_ticket
from bson import ObjectId

router = APIRouter()


# CLASSIFY ONLY
@router.post("/classify-ticket")
def classify(ticket: Ticket):

    prediction = classify_ticket(ticket.text)

    return {
        "ticket_text": ticket.text,
        "category": prediction
    }


# CREATE TICKET
@router.post("/create-ticket")
def create_ticket(ticket: Ticket):

    prediction = classify_ticket(ticket.text)

    team_map = {
        "network": "Network Team",
        "software": "Software Team",
        "hardware": "Hardware Team",
        "access": "Access Team"
    }

    assigned_team = team_map.get(prediction, "Support Team")

    ticket_data = {
        "text": ticket.text,
        "category": prediction,
        "assigned_team": assigned_team,
        "status": "open"
    }

    tickets_collection.insert_one(ticket_data)

    return {
        "message": "Ticket created successfully",
        "category": prediction,
        "assigned_team": assigned_team
    }


# ADMIN VIEW ALL TICKETS
@router.get("/admin/tickets")
def get_all_tickets():

    tickets = list(tickets_collection.find({}, {"_id": 0}))

    return {"tickets": tickets}


@router.get("/ticket/{ticket_id}")
def get_ticket(ticket_id: str):

    ticket = tickets_collection.find_one({"_id": ObjectId(ticket_id)})

    if not ticket:
        return {"error": "Ticket not found"}

    ticket["_id"] = str(ticket["_id"])

    return ticket
@router.put("/ticket/{ticket_id}")
def update_ticket(ticket_id: str, status: str):

    result = tickets_collection.update_one(
        {"_id": ObjectId(ticket_id)},
        {"$set": {"status": status}}
    )

    if result.modified_count == 0:
        return {"message": "No ticket updated"}

    return {"message": "Ticket updated successfully"}
@router.delete("/ticket/{ticket_id}")
def delete_ticket(ticket_id: str):

    result = tickets_collection.delete_one({"_id": ObjectId(ticket_id)})

    if result.deleted_count == 0:
        return {"message": "Ticket not found"}

    return {"message": "Ticket deleted successfully"}