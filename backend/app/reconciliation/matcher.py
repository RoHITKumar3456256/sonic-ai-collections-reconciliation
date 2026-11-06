import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.database import repository
from app.reconciliation.scorer import calculate_match_score

logger = logging.getLogger("sonic_ai.matcher")

def match_single_transaction(
    txn: Dict[str, Any],
    invoices: List[Dict[str, Any]],
    customers_by_id: Dict[str, Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Finds best matching invoice for a credit transaction.
    Returns recommendation or "No match".
    """
    txn_id = txn.get("reference") or f"TXN_{uuid.uuid4().hex[:6]}"
    credit = float(txn.get("credit", 0.0))

    best_score = 0.0
    best_inv = None
    best_breakdown = None

    for inv in invoices:
        # Skip invoices with 0 balance
        if float(inv.get("balance_due", 0.0)) <= 0:
            continue
        cust = customers_by_id.get(inv.get("customer_id"))
        score, breakdown = calculate_match_score(txn, inv, cust)
        if score > best_score:
            best_score = score
            best_inv = inv
            best_breakdown = breakdown

    # Threshold for candidate suggestion
    if best_score >= 0.40 and best_inv is not None:
        reason = f"Matched {best_inv.get('invoice_number')} ({int(best_score*100)}% confidence). {best_breakdown.get('match_notes', '')}"
        return {
            "id": f"sug_{txn.get('reference', uuid.uuid4().hex[:6])}",
            "bank_transaction_id": txn_id,
            "transaction_date": txn.get("date"),
            "transaction_description": txn.get("description"),
            "transaction_reference": txn.get("reference"),
            "transaction_amount": credit,
            "transaction_currency": txn.get("currency", "INR"),
            "candidate_invoice_id": best_inv.get("id"),
            "candidate_invoice_number": best_inv.get("invoice_number"),
            "candidate_customer_name": best_inv.get("customer_name"),
            "candidate_invoice_total": best_inv.get("total"),
            "candidate_balance_due": best_inv.get("balance_due"),
            "confidence_score": best_score,
            "reason": reason,
            "status": "pending",
            "breakdown": best_breakdown,
            "suggested_action": best_breakdown.get("suggested_action", "leave_balance_open")
        }
    else:
        return {
            "id": f"sug_{txn.get('reference', uuid.uuid4().hex[:6])}",
            "bank_transaction_id": txn_id,
            "transaction_date": txn.get("date"),
            "transaction_description": txn.get("description"),
            "transaction_reference": txn.get("reference"),
            "transaction_amount": credit,
            "transaction_currency": txn.get("currency", "INR"),
            "candidate_invoice_id": None,
            "candidate_invoice_number": None,
            "candidate_customer_name": None,
            "candidate_invoice_total": None,
            "candidate_balance_due": None,
            "confidence_score": 0.0,
            "reason": "No confident invoice candidate found matching amount, payer, or reference.",
            "status": "pending",
            "breakdown": None,
            "suggested_action": "no_match"
        }

def generate_reconciliation_batch(
    transactions: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Processes all imported credit transactions against open invoices.
    Debit transactions are already filtered out.
    """
    invoices = repository.get_invoices()
    customers = repository.get_customers()
    cust_map = {c.get("id"): c for c in customers}

    suggestions = []
    for txn in transactions:
        # Exclude debits or 0 amount credits
        credit = float(txn.get("credit", 0.0) or 0.0)
        if credit <= 0 or txn.get("debit"):
            continue
        sug = match_single_transaction(txn, invoices, cust_map)
        suggestions.append(sug)

    repository.save_reconciliation_suggestions(suggestions)
    return suggestions

def apply_match_approval(
    suggestion_id: str,
    action_type: str = "leave_balance_open",
    tds_amount: Optional[float] = None,
    actor: str = "operator@acmecorp.com",
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Idempotent approval execution:
    - Verifies invoice and suggestion state
    - Allocates receipt to invoice
    - Updates invoice balance and status
    - Records payment receipt and audit log
    """
    sug = repository.get_suggestion_by_id(suggestion_id)
    if not sug:
        raise ValueError(f"Suggestion {suggestion_id} not found")

    # Idempotency check: if already approved, do not double-apply payment!
    if sug.get("status") == "approved":
        existing_payments = [
            p for p in repository.get_payments() 
            if p.get("transaction_reference") == sug.get("transaction_reference")
        ]
        if existing_payments:
            logger.info(f"Idempotent approval: Suggestion {suggestion_id} already applied.")
            return existing_payments[0]

    inv_id = sug.get("candidate_invoice_id")
    if not inv_id:
        raise ValueError("Cannot approve a suggestion with no candidate invoice. Use manual selection.")

    invoice = repository.get_invoice_by_id(inv_id)
    if not invoice:
        raise ValueError(f"Invoice {inv_id} not found in database")

    amount = float(sug.get("transaction_amount", 0.0))
    prev_balance = float(invoice.get("balance_due", 0.0))
    prev_paid = float(invoice.get("paid_amount", 0.0))

    now_iso = datetime.now(timezone.utc).isoformat()
    tds_deducted = 0.0

    if action_type == "close_invoice_tds":
        # Deduct TDS: full invoice balance is cleared
        tds_deducted = round(max(0.0, prev_balance - amount), 2)
        new_balance = 0.0
        new_paid = prev_paid + amount
        new_status = "paid"
    else:
        # Partial or full payment without TDS closure
        new_balance = max(0.0, round(prev_balance - amount, 2))
        new_paid = prev_paid + amount
        new_status = "paid" if new_balance == 0.0 else "sent"

    # 1. Update invoice in DB
    updated_inv = repository.update_invoice(inv_id, {
        "balance_due": new_balance,
        "paid_amount": new_paid,
        "status": new_status
    })

    # 2. Record payment in DB
    payment_id = f"pay_{uuid.uuid4().hex[:8]}"
    payment_record = {
        "id": payment_id,
        "transaction_reference": sug.get("transaction_reference"),
        "invoice_id": inv_id,
        "invoice_number": invoice.get("invoice_number"),
        "customer_name": invoice.get("customer_name"),
        "amount": amount,
        "currency": sug.get("transaction_currency", "INR"),
        "tds_deducted": tds_deducted,
        "action_type": action_type,
        "previous_balance": prev_balance,
        "new_balance": new_balance,
        "invoice_status": new_status,
        "payment_date": sug.get("transaction_date"),
        "approved_by": actor,
        "notes": notes or f"Reconciliation approved ({action_type})",
        "created_at": now_iso
    }
    repository.add_payment(payment_record)

    # 3. Mark suggestion as approved
    repository.update_reconciliation_suggestion(suggestion_id, {
        "status": "approved",
        "approved_at": now_iso,
        "approved_by": actor,
        "applied_payment_id": payment_id
    })

    # 4. Create Audit Log
    repository.add_audit_log(
        action="reconciliation_approved",
        entity_type="payment",
        entity_id=payment_id,
        actor=actor,
        details={
            "suggestion_id": suggestion_id,
            "invoice_id": inv_id,
            "amount": amount,
            "tds_deducted": tds_deducted,
            "new_balance": new_balance,
            "new_status": new_status
        }
    )

    return payment_record

def apply_match_rejection(
    suggestion_id: str,
    reason: str = "Rejected by operator",
    actor: str = "operator@acmecorp.com"
) -> Dict[str, Any]:
    sug = repository.get_suggestion_by_id(suggestion_id)
    if not sug:
        raise ValueError(f"Suggestion {suggestion_id} not found")

    updated = repository.update_reconciliation_suggestion(suggestion_id, {
        "status": "rejected",
        "rejection_reason": reason,
        "rejected_by": actor,
        "rejected_at": datetime.now(timezone.utc).isoformat()
    })

    repository.add_audit_log(
        action="reconciliation_rejected",
        entity_type="reconciliation_suggestion",
        entity_id=suggestion_id,
        actor=actor,
        details={"reason": reason}
    )
    return updated

def apply_manual_selection(
    suggestion_id: str,
    selected_invoice_id: str,
    action_type: str = "leave_balance_open",
    tds_amount: Optional[float] = None,
    actor: str = "operator@acmecorp.com",
    notes: Optional[str] = None
) -> Dict[str, Any]:
    sug = repository.get_suggestion_by_id(suggestion_id)
    if not sug:
        raise ValueError(f"Suggestion {suggestion_id} not found")

    invoice = repository.get_invoice_by_id(selected_invoice_id)
    if not invoice:
        raise ValueError(f"Selected invoice {selected_invoice_id} not found")

    # Update candidate in suggestion
    repository.update_reconciliation_suggestion(suggestion_id, {
        "candidate_invoice_id": invoice.get("id"),
        "candidate_invoice_number": invoice.get("invoice_number"),
        "candidate_customer_name": invoice.get("customer_name"),
        "candidate_invoice_total": invoice.get("total"),
        "candidate_balance_due": invoice.get("balance_due"),
        "status": "manually_selected",
        "reason": f"Manually mapped by operator to {invoice.get('invoice_number')}"
    })

    # Now apply approval
    return apply_match_approval(
        suggestion_id=suggestion_id,
        action_type=action_type,
        tds_amount=tds_amount,
        actor=actor,
        notes=notes or "Manually selected invoice approval"
    )

