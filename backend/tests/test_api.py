import pytest
import sys
import io
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_db_before_tests():
    client.post("/api/demo/reset")

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_organization_endpoints():
    res = client.get("/api/organization")
    assert res.status_code == 200
    org = res.json()
    assert org["name"] == "AcmeCorp India Pvt Ltd"

    # Update org
    up_res = client.put("/api/organization", json={"name": "AcmeCorp Global Tech Ltd"})
    assert up_res.status_code == 200
    assert up_res.json()["name"] == "AcmeCorp Global Tech Ltd"

def test_customer_endpoints():
    res = client.get("/api/customers")
    assert res.status_code == 200
    custs = res.json()
    assert len(custs) >= 11

    # Edit customer email
    cust_id = custs[0]["id"]
    put_res = client.put(f"/api/customers/{cust_id}", json={"contact_email": "updated_test@example.com"})
    assert put_res.status_code == 200
    assert put_res.json()["contact_email"] == "updated_test@example.com"

def test_invoices_endpoints_and_overdue_filters():
    res = client.get("/api/invoices")
    assert res.status_code == 200
    invoices = res.json()
    assert len(invoices) >= 14

    overdue_res = client.get("/api/invoices/overdue")
    assert overdue_res.status_code == 200
    overdue_invoices = overdue_res.json()
    overdue_ids = [inv["id"] for inv in overdue_invoices]

    # Verify paid and draft invoices are excluded from overdue list
    assert "INV-1012" not in overdue_ids  # Paid
    assert "INV-1015" not in overdue_ids  # Draft
    assert "INV-1004" in overdue_ids      # Overdue sent

def test_collections_remind_blocks_draft_and_paid():
    # Attempting to send reminder for draft invoice must return 400
    res_draft = client.post("/api/collections/remind", json={"invoice_id": "INV-1015"})
    assert res_draft.status_code == 400
    assert "draft" in res_draft.json()["detail"].lower()

    # Attempting to send reminder for paid invoice must return 400
    res_paid = client.post("/api/collections/remind", json={"invoice_id": "INV-1012"})
    assert res_paid.status_code == 400
    assert "paid" in res_paid.json()["detail"].lower()

    # Valid overdue sent invoice works
    res_valid = client.post("/api/collections/remind", json={"invoice_id": "INV-1004"})
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert data["success"] is True
    assert "INV-1004" in data["body"]

def test_inbound_email_flow_and_review_routing():
    # 1. Dispute message -> must route to review queue (Needs Attention)
    dispute_reply = {
        "sender": "billing@kestrelfoods.example.com",
        "subject": "Dispute on Invoice INV-1004",
        "body": "We dispute the billing error on INV-1004. You overcharged us."
    }
    res = client.post("/api/email/check-inbox", json={"simulate_reply": dispute_reply})
    assert res.status_code == 200

    # Verify review queue contains this item
    rev_res = client.get("/api/reviews")
    assert rev_res.status_code == 200
    reviews = rev_res.json()
    assert any(r["category"] == "dispute" for r in reviews)

    # 2. Operator edits and sends draft
    dispute_rev = next(r for r in reviews if r["category"] == "dispute")
    send_res = client.post(
        f"/api/reviews/{dispute_rev['id']}/send",
        json={"edited_reply": "We have noted your dispute and will review within 3 business days."}
    )
    assert send_res.status_code == 200
    assert send_res.json()["status"] == "sent"

def test_csv_upload_and_debit_exclusion():
    sample_csv_path = Path(__file__).resolve().parents[2] / "data" / "bank_statement_sample.csv"
    assert sample_csv_path.exists()

    with open(sample_csv_path, "rb") as f:
        csv_bytes = f.read()

    res = client.post(
        "/api/reconciliation/upload",
        files={"file": ("bank_statement_sample.csv", io.BytesIO(csv_bytes), "text/csv")}
    )
    assert res.status_code == 200
    summary = res.json()["summary"]
    # 14 total rows, 2 debits excluded, 12 credits processed
    assert summary["total_rows_parsed"] == 14
    assert summary["debit_transactions_excluded"] == 2
    assert summary["credit_transactions_count"] == 12

    # Verify reconciliation suggestions
    sug_res = client.get("/api/reconciliation")
    assert sug_res.status_code == 200
    suggestions = sug_res.json()
    assert len(suggestions) == 12

    # Find Quillon Tech suggestion (TDS adjusted)
    quillon_sug = next(s for s in suggestions if "QUILLON" in s["transaction_description"])
    assert quillon_sug["candidate_invoice_number"] == "INV-1001"
    assert quillon_sug["suggested_action"] == "close_invoice_tds"

    # Approve Quillon Tech match with TDS deduction
    app_res = client.post(
        f"/api/reconciliation/{quillon_sug['id']}/approve",
        json={"action_type": "close_invoice_tds"}
    )
    assert app_res.status_code == 200
    payment = app_res.json()["payment"]
    assert payment["amount"] == 324000.0
    assert payment["new_balance"] == 0.0
    assert payment["invoice_status"] == "paid"

    # Verify payments endpoint has this approved receipt
    pay_res = client.get("/api/payments")
    assert pay_res.status_code == 200
    payments = pay_res.json()
    assert any(p["transaction_reference"] == "TXN906841" for p in payments)
