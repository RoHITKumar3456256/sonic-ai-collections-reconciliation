from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from app.database import repository

router = APIRouter()

@router.get("/conversations")
def list_conversations(customer_id: Optional[str] = Query(None)):
    return repository.get_conversations(customer_id=customer_id)

@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(conversation_id: str):
    conv = repository.get_conversation_by_id(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail=f"Conversation {conversation_id} not found.")
    messages = repository.get_messages_by_conversation(conversation_id)
    return {
        "conversation": conv,
        "messages": messages
    }

