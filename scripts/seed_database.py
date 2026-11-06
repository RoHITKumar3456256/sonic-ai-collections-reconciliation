import sys
import os
import json
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.database.mongodb import get_database
from app.database import repository

def seed():
    print("=== Sonic AI Database Seeder ===")
    db = get_database()
    data_dir = Path(__file__).resolve().parent.parent / "data"

    print("Clearing existing collections...")
    db.organizations.delete_many({})
    db.customers.delete_many({})
    db.invoices.delete_many({})
    db.conversations.delete_many({})
    db.messages.delete_many({})
    db.bank_transactions.delete_many({})
    db.reconciliation_suggestions.delete_many({})
    db.payments.delete_many({})
    db.review_queue.delete_many({})
    db.reminder_logs.delete_many({})

    # 1. Organization
    org_path = data_dir / "organization.json"
    if org_path.exists():
        with open(org_path, "r", encoding="utf-8") as f:
            org = json.load(f)
            db.organizations.insert_one(org)
            print(f"Loaded organization: {org.get('name')}")

    # 2. Customers
    cust_path = data_dir / "customers.json"
    if cust_path.exists():
        with open(cust_path, "r", encoding="utf-8") as f:
            customers = json.load(f)
            if customers:
                db.customers.insert_many(customers)
                print(f"Loaded {len(customers)} customers.")

    # 3. Invoices
    inv_path = data_dir / "invoices.json"
    if inv_path.exists():
        with open(inv_path, "r", encoding="utf-8") as f:
            invoices = json.load(f)
            if invoices:
                db.invoices.insert_many(invoices)
                print(f"Loaded {len(invoices)} invoices.")

    repository.add_audit_log(
        action="database_seeded",
        entity_type="system",
        entity_id="all",
        actor="cli_seeder",
        details={"status": "pristine_seed_complete"}
    )
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed()

