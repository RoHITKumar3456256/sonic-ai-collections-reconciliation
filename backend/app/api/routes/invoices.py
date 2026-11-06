from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timezone
from app.core.config import settings
from app.database import repository
from app.business.invoices import calculate_overdue_status
from app.schemas.invoice import InvoiceResponse

router = APIRouter()

def enrich_invoice(inv: dict, ref_date: str) -> dict:
    overdue_info = calculate_overdue_status(inv, ref_date)
    enriched = dict(inv)
    enriched["is_overdue"] = overdue_info["is_overdue"]
    enriched["days_overdue"] = overdue_info["days_overdue"]
    return enriched

@router.get("/invoices", response_model=List[InvoiceResponse])
def list_invoices(
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    currency: Optional[str] = Query(None)
):
    ref_date = settings.REFERENCE_DATE or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    invoices = repository.get_invoices(customer_id=customer_id, status=status, currency=currency)
    return [enrich_invoice(inv, ref_date) for inv in invoices]

@router.get("/invoices/overdue", response_model=List[InvoiceResponse])
def list_overdue_invoices():
    ref_date = settings.REFERENCE_DATE or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    all_invoices = repository.get_invoices()
    overdue_list = []
    for inv in all_invoices:
        enriched = enrich_invoice(inv, ref_date)
        if enriched["is_overdue"]:
            overdue_list.append(enriched)
    return overdue_list

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_single_invoice(invoice_id: str):
    ref_date = settings.REFERENCE_DATE or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    inv = repository.get_invoice_by_id(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found.")
    return enrich_invoice(inv, ref_date)
