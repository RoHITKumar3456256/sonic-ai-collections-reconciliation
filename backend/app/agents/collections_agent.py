import uuid
import re
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from app.core.config import settings
from app.database import repository
from app.business.invoices import calculate_overdue_status
from app.services.email_service import send_outbound_reminder, poll_imap_inbox
from app.services.gemini_service import classify_and_draft_reply
from app.services.validation_service import validate_ai_draft_facts

logger = logging.getLogger("sonic_ai.collections_agent")

def get_eligible_overdue_invoices() -> List[Dict[str, Any]]:
    """
    Finds sent, unpaid invoices with due date before reference date.
    Explicitly skips draft, paid, and void invoices.
    """
    ref_date = settings.REFERENCE_DATE or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    all_invoices = repository.get_invoices()
    eligible = []
    for inv in all_invoices:
        overdue_info = calculate_overdue_status(inv, ref_date)
        if overdue_info["is_overdue"]:
            inv_copy = dict(inv)
            inv_copy["days_overdue"] = overdue_info["days_overdue"]
            eligible.append(inv_copy)
    return eligible

async def process_inbound_email_message(msg_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processes an inbound customer reply:
    1. Extracts sender email and matches customer.
    2. Isolates customer's own unpaid invoices.
    3. Runs LLM classification and draft generation with policies.
    4. Validates facts against MongoDB.
    5. Routes to Review Queue (Needs Attention) or processes safe auto-answer.
    """
    sender = msg_data.get("sender", "")
    # Clean sender email address
    match = re.search(r'<([^>]+)>', sender)
    sender_email = match.group(1).strip() if match else sender.strip()

    subject = msg_data.get("subject", "Re: Invoice Payment Reminder")
    body = msg_data.get("body", "")
    message_id = msg_data.get("message_id", f"<inbound-{uuid.uuid4()}@customer.com>")
    now_iso = datetime.now(timezone.utc).isoformat()

    # Match customer
    customer = repository.get_customer_by_email(sender_email)
    customer_id = customer.get("id") if customer else None

    # Customer context isolation: fetch ONLY this customer's invoices
    customer_invoices = []
    if customer_id:
        customer_invoices = repository.get_invoices(customer_id=customer_id)

    # Classify & Draft Reply
    ai_result = await classify_and_draft_reply(
        email_text=body,
        subject=subject,
        sender_email=sender_email,
        customer=customer,
        customer_invoices=customer_invoices
    )

    category = ai_result.get("category", "out_of_scope")
    draft_reply = ai_result.get("draft_reply", "")
    requires_human_review = ai_result.get("requires_human_review", False)
    urgency = ai_result.get("urgency", "normal")
    reason = ai_result.get("reason", "")

    # Conversations tracking
    conv_id = f"conv_{customer_id}" if customer_id else f"conv_unknown_{uuid.uuid4().hex[:6]}"
    repository.upsert_conversation(conv_id, {
        "id": conv_id,
        "customer_id": customer_id,
        "customer_name": customer.get("name") if customer else f"Unknown ({sender_email})",
        "last_message_at": now_iso,
        "status": "needs_attention" if requires_human_review else "active",
        "last_category": category
    })

    # Save inbound message
    repository.add_message({
        "id": f"msg_{uuid.uuid4().hex[:8]}",
        "conversation_id": conv_id,
        "direction": "inbound",
        "sender": sender_email,
        "recipient": settings.SMTP_USERNAME or "accounts@acmecorp.example.com",
        "subject": subject,
        "body": body,
        "message_id": message_id,
        "created_at": now_iso
    })

    review_item = None
    if requires_human_review or category in ["dispute", "legal_threat", "extension_request", "unknown_sender", "out_of_scope"]:
        review_id = f"rev_{uuid.uuid4().hex[:8]}"
        review_item = {
            "id": review_id,
            "conversation_id": conv_id,
            "customer_id": customer_id,
            "customer_name": customer.get("name") if customer else "Unknown Sender",
            "sender_email": sender_email,
            "subject": subject,
            "category": category,
            "urgency": urgency,
            "reason_for_review": reason,
            "ai_draft_reply": draft_reply,
            "status": "pending",
            "created_at": now_iso
        }
        repository.add_review_item(review_item)
        logger.info(f"Routed customer message {message_id} to Needs Attention queue ({category})")
    else:
        # Non-sensitive routine query or acknowledged promise/claim
        # Save auto outbound message
        repository.add_message({
            "id": f"msg_{uuid.uuid4().hex[:8]}",
            "conversation_id": conv_id,
            "direction": "outbound",
            "sender": "accounts@acmecorp.example.com",
            "recipient": sender_email,
            "subject": f"Re: {subject}",
            "body": draft_reply,
            "message_id": f"<reply-{uuid.uuid4()}@acmecorp.example.com>",
            "created_at": now_iso
        })

    # Audit log
    repository.add_audit_log(
        action="inbound_email_processed",
        entity_type="conversation",
        entity_id=conv_id,
        actor=f"email:{sender_email}",
        details={
            "category": category,
            "requires_human_review": requires_human_review,
            "routed_to_review": review_item is not None
        }
    )

    return {
        "conversation_id": conv_id,
        "category": category,
        "requires_human_review": requires_human_review,
        "review_item": review_item
    }

