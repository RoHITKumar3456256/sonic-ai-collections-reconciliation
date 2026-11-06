import json
from pathlib import Path
from fastapi import APIRouter
from app.database.mongodb import get_database
from app.database import repository

router = APIRouter()

DATA_DIR = Path(__file__).resolve().parents[4] / "data"
if not DATA_DIR.exists():
    DATA_DIR = Path(__file__).resolve().parents[3] / "data"

@router.post("/demo/reset")
def reset_demo_database():
    """
    Restores original seed data:
    - Reloads organization.json, customers.json, invoices.json
    - Clears demo conversations, messages, bank transactions, reconciliation suggestions, payments, review queue, and reminder logs.
    """
    db = get_database()

    # Clear transient collections
    db.conversations.delete_many({})
    db.messages.delete_many({})
    db.bank_transactions.delete_many({})
    db.reconciliation_suggestions.delete_many({})
    db.payments.delete_many({})
    db.review_queue.delete_many({})
    db.reminder_logs.delete_many({})

    # Clear core collections to reload fresh seed data
    db.organizations.delete_many({})
    db.customers.delete_many({})
    db.invoices.delete_many({})

    # Load organization.json
    org_file = DATA_DIR / "organization.json"
    if org_file.exists():
        with open(org_file, "r", encoding="utf-8") as f:
            org_data = json.load(f)
            db.organizations.insert_one(org_data)

    # Load customers.json
    cust_file = DATA_DIR / "customers.json"
    cust_count = 0
    if cust_file.exists():
        with open(cust_file, "r", encoding="utf-8") as f:
            cust_data = json.load(f)
            if cust_data:
                db.customers.insert_many(cust_data)
                cust_count = len(cust_data)

    # Load invoices.json
    inv_file = DATA_DIR / "invoices.json"
    inv_count = 0
    if inv_file.exists():
        with open(inv_file, "r", encoding="utf-8") as f:
            inv_data = json.load(f)
            if inv_data:
                db.invoices.insert_many(inv_data)
                inv_count = len(inv_data)

    repository.add_audit_log(
        action="demo_database_reset",
        entity_type="system",
        entity_id="all",
        actor="operator",
        details={
            "customers_restored": cust_count,
            "invoices_restored": inv_count
        }
    )

    return {
        "success": True,
        "message": "Demo database successfully restored to pristine assignment state.",
        "customers_seeded": cust_count,
        "invoices_seeded": inv_count
    }

@router.get("/audit-logs")
def get_audit_trail(limit: int = 50):
    return repository.get_audit_logs(limit=limit)
