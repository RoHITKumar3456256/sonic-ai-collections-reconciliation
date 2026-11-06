from pydantic import BaseModel, EmailStr
from typing import Optional

class CustomerBase(BaseModel):
    id: str
    name: str
    country: str
    contact_name: Optional[str] = None
    contact_email: str
    phone: Optional[str] = None
    currency: str = "INR"
    tax_id: Optional[str] = None
    payment_terms: str = "Net 30"

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    currency: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None

class CustomerResponse(CustomerBase):
    updated_at: Optional[str] = None

