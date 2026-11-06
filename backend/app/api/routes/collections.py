from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.core.config import settings
from app.database import repository
from app.business.invoices import calculate_overdue_status
from app.services.email_service import send_outbound_reminder
from app.schemas.collections import ReminderSendRequest, ReminderSendResponse

router = APIRouter()

@router.post("/collections/remind", response_model=ReminderSendResponse)
def send_reminder_endpoint(payload: ReminderSendRequest):
    invoice = repository.get_invoice_by_id(payload.invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice {payload.invoice_id} not found.")

    # Rule: Draft or already-paid invoices CANNOT receive reminders
    status = invoice.get("status", "").lower()
    balance = float(invoice.get("balance_due", 0.0))
    if status == "draft":
        raise HTTPException(status_code=400, detail="Cannot send reminder for an invoice in 'draft' status.")
    if status == "paid" or balance <= 0:
        raise HTTPException(status_code=400, detail="Cannot send reminder for an invoice that is already paid / zero balance.")

    ref_date = settings.REFERENCE_DATE or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    overdue_info = calculate_overdue_status(invoice, ref_date)
    if not overdue_info["is_overdue"]:
        # Warn if not strictly overdue, but if operator explicitly triggers, verify status is sent
        if status != "sent":
            raise HTTPException(status_code=400, detail=f"Invoice status '{status}' is not eligible for reminders.")

    customer = repository.get_customer_by_id(invoice.get("customer_id"))
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer {invoice.get('customer_id')} not found.")

    org = repository.get_organization() or {
        "name": "AcmeCorp India Pvt Ltd",
        "accounts_email": "accounts@acmecorp.example.com",
        "bank_details": {}
    }

    result = send_outbound_reminder(
        invoice=invoice,
        customer=customer,
        organization=org,
        custom_message=payload.custom_message,
        override_recipient=payload.override_recipient
    )

    repository.add_audit_log(
        action="collection_reminder_sent",
        entity_type="invoice",
        entity_id=invoice.get("id"),
        actor="operator",
        details={
            "recipient": result["recipient"],
            "mode": result["mode"],
            "idempotency_key": result["idempotency_key"]
        }
    )

    return result
