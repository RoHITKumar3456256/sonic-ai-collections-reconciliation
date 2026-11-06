from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ReviewQueueResponse(BaseModel):
    id: str
    conversation_id: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    sender_email: str
    subject: str
    category: str  # routine_query, payment_promise, payment_claim, extension_request, dispute, legal_threat, unknown_sender, out_of_scope
    urgency: str   # normal, high, critical
    reason_for_review: str
    ai_draft_reply: str
    status: str = "pending" # pending, sent, dismissed
    created_at: str

class SendReviewDraftRequest(BaseModel):
    edited_reply: str
    recipient: Optional[str] = None
    close_review: bool = True
