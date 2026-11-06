from fastapi import APIRouter
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.services.email_service import poll_imap_inbox
from app.agents.collections_agent import process_inbound_email_message
from app.schemas.collections import CheckInboxRequest, CheckInboxResponse

router = APIRouter()

@router.post("/email/check-inbox", response_model=CheckInboxResponse)
async def check_inbox_endpoint(payload: CheckInboxRequest = None):
    new_messages = []
    mode = "live_imap"

    # If payload contains a simulated test reply, inject it
    if payload and payload.simulate_reply:
        new_messages.append(payload.simulate_reply)
        mode = "test_simulation"
    else:
        # Check real IMAP
        imap_msgs = poll_imap_inbox()
        if imap_msgs:
            new_messages.extend(imap_msgs)
        else:
            mode = "live_imap_empty"

    processed_convs = []
    details = []

    for msg in new_messages:
        res = await process_inbound_email_message(msg)
        conv_id = res.get("conversation_id")
        if conv_id and conv_id not in processed_convs:
            processed_convs.append(conv_id)
        details.append({
            "sender": msg.get("sender"),
            "subject": msg.get("subject"),
            "category": res.get("category"),
            "requires_human_review": res.get("requires_human_review")
        })

    return {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "mode": mode,
        "new_messages_count": len(new_messages),
        "processed_conversations": processed_convs,
        "details": details
    }
