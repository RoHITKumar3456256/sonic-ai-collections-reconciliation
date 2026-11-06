import pytest
import sys
from pathlib import Path

# Set up test path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import repository
from app.api.routes.demo import reset_demo_database
from app.business.invoices import calculate_overdue_status
from app.services.validation_service import validate_ai_draft_facts
from app.reconciliation.scorer import calculate_match_score, normalize_text
from app.reconciliation.matcher import (
    generate_reconciliation_batch,
    apply_match_approval,
    apply_match_rejection
)
from app.agents.collections_agent import get_eligible_overdue_invoices

@pytest.fixture(autouse=True)
def setup_pristine_database():
    """Ensure every test runs on a fresh seed dataset."""
    reset_demo_database()

def test_dynamic_overdue_rules():
    # Sent invoice with due date before reference date is OVERDUE
    overdue_inv = {
        "id": "INV-1004",
        "status": "sent",
        "balance_due": 59000.0,
        "due_date": "2026-08-31"
    }
    res = calculate_overdue_status(overdue_inv, "2026-11-01")
    assert res["is_overdue"] is True
    assert res["days_overdue"] > 0

    # Paid invoice is NEVER overdue
    paid_inv = {
        "id": "INV-1012",
        "status": "paid",
        "balance_due": 0.0,
        "due_date": "2026-07-31"
    }
    res = calculate_overdue_status(paid_inv, "2026-11-01")
    assert res["is_overdue"] is False

    # Draft invoice is NEVER overdue
    draft_inv = {
        "id": "INV-1015",
        "status": "draft",
        "balance_due": 150000.0,
        "due_date": "2026-10-25"
    }
    res = calculate_overdue_status(draft_inv, "2026-11-01")
    assert res["is_overdue"] is False

    # Future due date invoice is NOT overdue
    future_inv = {
        "id": "INV-1016",
        "status": "sent",
        "balance_due": 80000.0,
        "due_date": "2026-12-01"
    }
    res = calculate_overdue_status(future_inv, "2026-11-01")
    assert res["is_overdue"] is False

def test_eligible_overdue_invoices_excludes_draft_and_paid():
    eligible = get_eligible_overdue_invoices()
    eligible_ids = [inv["id"] for inv in eligible]

    # Verify overdue sent invoices are present
    assert "INV-1004" in eligible_ids
    assert "INV-1001" in eligible_ids
    assert "INV-1003" in eligible_ids

    # Verify paid and draft invoices are excluded
    assert "INV-1012" not in eligible_ids  # Paid
    assert "INV-1015" not in eligible_ids  # Draft
    assert "INV-1016" not in eligible_ids  # Future due date

def test_ai_facts_validation():
    customer_invoices = [
        {"invoice_number": "INV-1001", "total": 354000.0, "balance_due": 354000.0}
    ]

    # Valid draft quoting real invoice
    valid_draft = "Dear Sir, regarding invoice INV-1001 for INR 354,000, please find our bank details."
    is_valid, errors = validate_ai_draft_facts(valid_draft, customer_invoices)
    assert is_valid is True
    assert len(errors) == 0

    # Invalid draft inventing an invoice number
    hallucinated_draft = "Dear Sir, your invoice INV-9999 has been generated."
    is_valid, errors = validate_ai_draft_facts(hallucinated_draft, customer_invoices)
    assert is_valid is False
    assert any("INV-9999" in e for e in errors)

    # Unauthorized extension promise
    unauthorized_draft = "I have granted you an extension until next month for INV-1001."
    is_valid, errors = validate_ai_draft_facts(unauthorized_draft, customer_invoices)
    assert is_valid is False
    assert any("unauthorized" in e.lower() for e in errors)

def test_tds_adjusted_reconciliation_matching():
    # Quillon Tech: Subtotal 300,000 + GST 54,000 = Total 354,000.
    # TDS 10% on subtotal = 30,000. Net Receipt = 324,000.
    txn = {
        "date": "2026-09-21",
        "description": "QUILLON TECH",
        "reference": "TXN906841",
        "credit": 324000.0,
        "currency": "INR"
    }
    inv = repository.get_invoice_by_id("INV-1001")
    cust = repository.get_customer_by_id(inv["customer_id"])

    score, breakdown = calculate_match_score(txn, inv, cust)
    assert score >= 0.70
    assert breakdown["match_type"] == "tds_adjusted"
    assert breakdown["suggested_action"] == "close_invoice_tds"
    assert breakdown["tds_amount"] == 30000.0

def test_partial_payment_reconciliation_matching():
    # Orbis Pkg: Total 295,000. Part payment: 200,000.
    txn = {
        "date": "2026-09-10",
        "description": "ORBIS PKG / PART PAYMENT",
        "reference": "TXN905103",
        "credit": 200000.0,
        "currency": "INR"
    }
    inv = repository.get_invoice_by_id("INV-1003")
    cust = repository.get_customer_by_id(inv["customer_id"])

    score, breakdown = calculate_match_score(txn, inv, cust)
    assert score >= 0.70
    assert breakdown["match_type"] == "partial_payment"
    assert breakdown["suggested_action"] == "leave_balance_open"

def test_currency_mismatch_rejection():
    txn = {
        "date": "2026-09-28",
        "description": "HARBOUR ANALYTICS / INV1021",
        "reference": "TXN_MISMATCH",
        "credit": 12500.0,
        "currency": "INR"  # Mismatched currency (Invoice is USD)
    }
    inv = repository.get_invoice_by_id("INV-1021")  # USD invoice
    cust = repository.get_customer_by_id(inv["customer_id"])

    score, breakdown = calculate_match_score(txn, inv, cust)
    assert score == 0.0
    assert breakdown["match_type"] == "currency_mismatch"

def test_reconciliation_approval_is_idempotent():
    txn = {
        "date": "2026-09-05",
        "description": "KESTREL FOODS / INV 1004",
        "reference": "TXN904812",
        "credit": 59000.0,
        "currency": "INR"
    }
    suggestions = generate_reconciliation_batch([txn])
    assert len(suggestions) == 1
    sug_id = suggestions[0]["id"]

    # First approval
    payment1 = apply_match_approval(sug_id, action_type="leave_balance_open")
    assert payment1["amount"] == 59000.0
    assert payment1["new_balance"] == 0.0
    assert payment1["invoice_status"] == "paid"

    # Second approval (Idempotent: must NOT create duplicate payment or double deduct)
    payment2 = apply_match_approval(sug_id, action_type="leave_balance_open")
    assert payment2["id"] == payment1["id"]

    # Verify payments collection has only 1 record
    all_payments = [p for p in repository.get_payments() if p["transaction_reference"] == "TXN904812"]
    assert len(all_payments) == 1
