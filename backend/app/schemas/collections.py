from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ReminderSendRequest(BaseModel):
    invoice_id: str
    custom_message: Optional[str] = None
    override_recipient: Optional[str] = None

class ReminderSendResponse(BaseModel):
    success: bool
    invoice_id: str
    recipient: str
    message_id: str
    subject: str
    body: str
    idempotency_key: str
    mode: str  # live_smtp or simulated
    timestamp: str

class CheckInboxRequest(BaseModel):
    simulate_reply: Optional[Dict[str, Any]] = None # allows test simulation of incoming replies

class CheckInboxResponse(BaseModel):
    checked_at: str
    mode: str
    new_messages_count: int
    processed_conversations: List[str]
    details: List[Dict[str, Any]]

