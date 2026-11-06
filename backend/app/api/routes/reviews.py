import uuid
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from typing import List, Optional
from app.database import repository
from app.schemas.review import ReviewQueueResponse, SendReviewDraftRequest

router = APIRouter()

@router.get("/reviews", response_model=List[ReviewQueueResponse])
def get_reviews_endpoint(status: Optional[str] = Query("pending")):
    return repository.get_review_queue(status=status)

@router.post("/reviews/{review_id}/send")
def send_review_draft_endpoint(review_id: str, payload: SendReviewDraftRequest):
    item = repository.get_review_item(review_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Review queue item {review_id} not found.")

    recipient = payload.recipient or item.get("sender_email")
    conv_id = item.get("conversation_id")
    now_iso = datetime.now(timezone.utc).isoformat()

    # Append human-approved outbound message to conversation
    msg_entry = {
        "id": f"msg_{uuid.uuid4().hex[:8]}",
        "conversation_id": conv_id,
        "direction": "outbound",
        "sender": "accounts@acmecorp.example.com",
        "recipient": recipient,
        "subject": f"Re: {item.get('subject', 'Account Inquiry')}",
        "body": payload.edited_reply,
        "message_id": f"<human-reply-{uuid.uuid4()}@acmecorp.example.com>",
        "is_human_reviewed": True,
        "created_at": now_iso
    }
    repository.add_message(msg_entry)

    # Mark review item as resolved/sent
    if payload.close_review:
        repository.update_review_item(review_id, {
            "status": "sent",
            "resolved_at": now_iso,
            "final_sent_reply": payload.edited_reply
        })

    # Update conversation status to active
    repository.upsert_conversation(conv_id, {
        "status": "active",
        "last_message_at": now_iso
    })

    # Audit log
    repository.add_audit_log(
        action="human_review_sent",
        entity_type="review_queue",
        entity_id=review_id,
        actor="operator",
        details={
            "conversation_id": conv_id,
            "recipient": recipient,
            "original_category": item.get("category")
        }
    )

    return {
        "success": True,
        "review_id": review_id,
        "status": "sent",
        "message": msg_entry
    }
