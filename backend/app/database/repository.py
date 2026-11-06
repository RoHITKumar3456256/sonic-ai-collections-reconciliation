import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Dict, Any
from app.database.mongodb import get_database

logger = logging.getLogger("sonic_ai.repository")

def get_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# --- Organizations ---
def get_organization() -> Optional[Dict[str, Any]]:
    db = get_database()
    doc = db.organizations.find_one({}, {"_id": 0})
    return doc

def update_organization(data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_database()
    data["updated_at"] = get_now_iso()
    org_id = data.get("id", "org_acmecorp_001")
    db.organizations.update_one({"id": org_id}, {"$set": data}, upsert=True)
    return get_organization()

# --- Customers ---
def get_customers(search: Optional[str] = None) -> List[Dict[str, Any]]:
    db = get_database()
    query = {}
    if search:
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"contact_email": {"$regex": search, "$options": "i"}},
                {"id": {"$regex": search, "$options": "i"}}
            ]
        }
    docs = list(db.customers.find(query, {"_id": 0}))
    return docs

def get_customer_by_id(customer_id: str) -> Optional[Dict[str, Any]]:
    db = get_database()
    return db.customers.find_one({"id": customer_id}, {"_id": 0})

def get_customer_by_email(email: str) -> Optional[Dict[str, Any]]:
    db = get_database()
    if not email:
        return None
    # match exact email case-insensitively
    return db.customers.find_one({"contact_email": {"$regex": f"^{email.strip()}$", "$options": "i"}}, {"_id": 0})

def update_customer(customer_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    db = get_database()
    data["updated_at"] = get_now_iso()
    db.customers.update_one({"id": customer_id}, {"$set": data})
    return get_customer_by_id(customer_id)

# --- Invoices ---
def get_invoices(
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    currency: Optional[str] = None
) -> List[Dict[str, Any]]:
    db = get_database()
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    if status:
        query["status"] = status
    if currency:
        query["currency"] = currency
    docs = list(db.invoices.find(query, {"_id": 0}))
    return docs

def get_invoice_by_id(invoice_id: str) -> Optional[Dict[str, Any]]:
    db = get_database()
    return db.invoices.find_one(
        {"$or": [{"id": invoice_id}, {"invoice_number": invoice_id}]},
        {"_id": 0}
    )

def update_invoice(invoice_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    db = get_database()
    data["updated_at"] = get_now_iso()
    db.invoices.update_one(
        {"$or": [{"id": invoice_id}, {"invoice_number": invoice_id}]},
        {"$set": data}
    )
    return get_invoice_by_id(invoice_id)

def get_overdue_invoices(reference_date: str) -> List[Dict[str, Any]]:
    """
    Overdue dynamic formula:
    status == 'sent' AND balance_due > 0 AND due_date < reference_date
    """
    db = get_database()
    query = {
        "status": "sent",
        "balance_due": {"$gt": 0},
        "due_date": {"$lt": reference_date}
    }
    docs = list(db.invoices.find(query, {"_id": 0}))
    return docs

# --- Conversations & Messages ---
def get_conversations(customer_id: Optional[str] = None) -> List[Dict[str, Any]]:
    db = get_database()
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    return list(db.conversations.find(query, {"_id": 0}).sort("updated_at", -1))

def get_conversation_by_id(conversation_id: str) -> Optional[Dict[str, Any]]:
    db = get_database()
    return db.conversations.find_one({"id": conversation_id}, {"_id": 0})

def upsert_conversation(conv_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_database()
    data["updated_at"] = get_now_iso()
    db.conversations.update_one({"id": conv_id}, {"$set": data}, upsert=True)
    return get_conversation_by_id(conv_id)

def add_message(message_data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_database()
    if "created_at" not in message_data:
        message_data["created_at"] = get_now_iso()
    clean_data = dict(message_data)
    db.messages.insert_one(dict(clean_data))
    clean_data.pop("_id", None)
    return clean_data

def get_messages_by_conversation(conversation_id: str) -> List[Dict[str, Any]]:
    db = get_database()
    return list(db.messages.find({"conversation_id": conversation_id}, {"_id": 0}).sort("created_at", 1))

# --- Review Queue (Needs Attention) ---
def get_review_queue(status: Optional[str] = None) -> List[Dict[str, Any]]:
    db = get_database()
    query = {}
    if status:
        query["status"] = status
    return list(db.review_queue.find(query, {"_id": 0}).sort("created_at", -1))

def get_review_item(review_id: str) -> Optional[Dict[str, Any]]:
    db = get_database()
    return db.review_queue.find_one({"id": review_id}, {"_id": 0})

def add_review_item(item_data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_database()
    if "created_at" not in item_data:
        item_data["created_at"] = get_now_iso()
    clean_data = dict(item_data)
    db.review_queue.insert_one(dict(clean_data))
    clean_data.pop("_id", None)
    return clean_data

def update_review_item(review_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    db = get_database()
    data["updated_at"] = get_now_iso()
    db.review_queue.update_one({"id": review_id}, {"$set": data})
    return get_review_item(review_id)

# --- Bank Transactions & Reconciliation Suggestions ---
def add_bank_transactions(txns: List[Dict[str, Any]]) -> int:
    db = get_database()
    count = 0
    for txn in txns:
        ref = txn.get("reference")
        # Deduplication check
        if ref and db.bank_transactions.find_one({"reference": ref}):
            continue
        clean = dict(txn)
        if "created_at" not in clean:
            clean["created_at"] = get_now_iso()
        db.bank_transactions.insert_one(clean)
        count += 1
    return count

def get_bank_transactions() -> List[Dict[str, Any]]:
    db = get_database()
    return list(db.bank_transactions.find({}, {"_id": 0}).sort("date", 1))

def save_reconciliation_suggestions(suggestions: List[Dict[str, Any]]) -> None:
    db = get_database()
    for item in suggestions:
        clean = dict(item)
        item_id = clean.get("id")
        clean["updated_at"] = get_now_iso()
        db.reconciliation_suggestions.update_one({"id": item_id}, {"$set": clean}, upsert=True)

def get_reconciliation_suggestions(status: Optional[str] = None) -> List[Dict[str, Any]]:
    db = get_database()
    query = {}
    if status:
        query["status"] = status
    return list(db.reconciliation_suggestions.find(query, {"_id": 0}))

def get_suggestion_by_id(suggestion_id: str) -> Optional[Dict[str, Any]]:
    db = get_database()
    return db.reconciliation_suggestions.find_one({"id": suggestion_id}, {"_id": 0})

def update_reconciliation_suggestion(suggestion_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    db = get_database()
    data["updated_at"] = get_now_iso()
    db.reconciliation_suggestions.update_one({"id": suggestion_id}, {"$set": data})
    return get_suggestion_by_id(suggestion_id)

# --- Payments & Allocations ---
def add_payment(payment_data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_database()
    clean = dict(payment_data)
    if "created_at" not in clean:
        clean["created_at"] = get_now_iso()
    db.payments.insert_one(dict(clean))
    clean.pop("_id", None)
    return clean

def get_payments() -> List[Dict[str, Any]]:
    db = get_database()
    return list(db.payments.find({}, {"_id": 0}).sort("payment_date", -1))

# --- Reminder Logs ---
def add_reminder_log(log_data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_database()
    clean = dict(log_data)
    if "created_at" not in clean:
        clean["created_at"] = get_now_iso()
    db.reminder_logs.insert_one(dict(clean))
    clean.pop("_id", None)
    return clean

def get_reminder_logs(invoice_id: Optional[str] = None) -> List[Dict[str, Any]]:
    db = get_database()
    query = {}
    if invoice_id:
        query["invoice_id"] = invoice_id
    return list(db.reminder_logs.find(query, {"_id": 0}).sort("created_at", -1))

# --- Audit Logs ---
def add_audit_log(
    action: str,
    entity_type: str,
    entity_id: str,
    actor: str,
    details: Dict[str, Any]
) -> Dict[str, Any]:
    db = get_database()
    entry = {
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "actor": actor,
        "details": details,
        "created_at": get_now_iso()
    }
    db.audit_logs.insert_one(dict(entry))
    entry.pop("_id", None)
    return entry

def get_audit_logs(limit: int = 50) -> List[Dict[str, Any]]:
    db = get_database()
    return list(db.audit_logs.find({}, {"_id": 0}).sort("created_at", -1).limit(limit))

