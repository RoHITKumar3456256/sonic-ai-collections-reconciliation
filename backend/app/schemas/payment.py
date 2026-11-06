from pydantic import BaseModel
from typing import Optional, Dict, Any

class PaymentResponse(BaseModel):
    id: str
    transaction_reference: str
    invoice_id: str
    invoice_number: str
    customer_name: str
    amount: float
    currency: str
    tds_deducted: float = 0.0
    action_type: str
    previous_balance: float
    new_balance: float
    invoice_status: str
    payment_date: str
    approved_by: str
    notes: Optional[str] = None
    created_at: str
