from pydantic import BaseModel

class Ticket(BaseModel):
    text: str