from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class MatchScoreDetails(BaseModel):
    invoice_number_score: float = 0.0
    payer_name_score: float = 0.0
    amount_score: float = 0.0
    date_proximity_score: float = 0.0
    currency_score: float = 0.0
    total_confidence: float = 0.0
    match_type: str = "no_match" # exact, partial, tds_adjusted, name_only, no_match
    match_notes: str = ""

class ReconciliationSuggestionResponse(BaseModel):
    id: str
    bank_transaction_id: str
    transaction_date: str
    transaction_description: str
    transaction_reference: str
    transaction_amount: float
    transaction_currency: str
    candidate_invoice_id: Optional[str] = None
    candidate_invoice_number: Optional[str] = None
    candidate_customer_name: Optional[str] = None
    candidate_invoice_total: Optional[float] = None
    candidate_balance_due: Optional[float] = None
    confidence_score: float = 0.0
    reason: str
    status: str = "pending" # pending, approved, rejected, manually_selected
    breakdown: Optional[MatchScoreDetails] = None
    suggested_action: str = "leave_balance_open" # close_invoice_tds, leave_balance_open, full_settlement

class ApproveMatchRequest(BaseModel):
    action_type: str = "leave_balance_open" # 'close_invoice_tds' or 'leave_balance_open'
    tds_amount: Optional[float] = None
    notes: Optional[str] = None

class RejectMatchRequest(BaseModel):
    reason: Optional[str] = "Rejected by human reviewer"

class ManualSelectMatchRequest(BaseModel):
    invoice_id: str
    action_type: str = "leave_balance_open"
    tds_amount: Optional[float] = None
    notes: Optional[str] = None
