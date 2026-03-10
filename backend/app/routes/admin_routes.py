from fastapi import APIRouter
from app.database import tickets_collection
from bson import ObjectId

router = APIRouter(prefix="/admin", tags=["Admin"])

# Get all tickets
@router.get("/tickets")
def get_all_tickets():

    tickets = list(tickets_collection.find())

    for ticket in tickets:
        ticket["_id"] = str(ticket["_id"])

    return {
        "total_tickets": len(tickets),
        "tickets": tickets
    }


# Get a specific ticket
@router.get("/ticket/{ticket_id}")
def get_ticket(ticket_id: str):

    ticket = tickets_collection.find_one({"_id": ObjectId(ticket_id)})

    if not ticket:
        return {"error": "Ticket not found"}

    ticket["_id"] = str(ticket["_id"])

    return ticket


# Update ticket status
@router.put("/ticket/{ticket_id}")
def update_ticket(ticket_id: str, status: str):

    result = tickets_collection.update_one(
        {"_id": ObjectId(ticket_id)},
        {"$set": {"status": status}}
    )

    if result.modified_count == 0:
        return {"message": "Ticket not updated"}

    return {"message": "Ticket updated successfully"}


# Delete ticket
@router.delete("/ticket/{ticket_id}")
def delete_ticket(ticket_id: str):

    result = tickets_collection.delete_one({"_id": ObjectId(ticket_id)})

    if result.deleted_count == 0:
        return {"message": "Ticket not found"}

    return {"message": "Ticket deleted successfully"}