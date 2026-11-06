from pydantic import BaseModel, Field
from typing import List, Optional

class InvoiceItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    amount: float

class InvoiceBase(BaseModel):
    id: str
    invoice_number: str
    customer_id: str
    customer_name: str
    issue_date: str
    due_date: str
    currency: str = "INR"
    subtotal: float
    tax: float = 0.0
    total: float
    paid_amount: float = 0.0
    balance_due: float
    status: str = "sent" # draft, sent, paid, void
    description: Optional[str] = None
    items: Optional[List[InvoiceItem]] = None
    notes: Optional[str] = None

class InvoiceResponse(InvoiceBase):
    is_overdue: bool = False
    days_overdue: int = 0
    updated_at: Optional[str] = None
