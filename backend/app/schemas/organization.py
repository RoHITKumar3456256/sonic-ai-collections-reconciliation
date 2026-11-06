from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any

class BillingAddress(BaseModel):
    line1: str
    city: str
    state: str
    postal_code: str
    country: str

class BankDetails(BaseModel):
    bank_name: str
    account_name: str
    account_number: str
    ifsc_code: str
    swift_code: str
    upi_id: Optional[str] = None

class Policies(BaseModel):
    tds_deduction_rate_indian: float = 0.10
    tds_note: str
    international_bank_charges: str
    payment_terms_days: int = 30
    working_hours: str = "Monday–Friday, 10:00–18:00 IST"
    dispute_review_window_days: int = 3
    approval_required_for_extensions: bool = True
    approval_required_for_installments: bool = True
    accounts_team_contact: str = "accounts@acmecorp.example.com"

class OrganizationBase(BaseModel):
    name: str
    registration_number: Optional[str] = None
    tax_id: Optional[str] = None
    accounts_email: str
    billing_address: BillingAddress
    bank_details: BankDetails
    policies: Policies

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    registration_number: Optional[str] = None
    tax_id: Optional[str] = None
    accounts_email: Optional[str] = None
    billing_address: Optional[BillingAddress] = None
    bank_details: Optional[BankDetails] = None
    policies: Optional[Policies] = None

class OrganizationResponse(OrganizationBase):
    id: str = "org_acmecorp_001"
    updated_at: Optional[str] = None
