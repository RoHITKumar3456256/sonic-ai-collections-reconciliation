from typing import Dict, Any

ORGANIZATION_POLICIES = {
    "tds_deduction_rate_indian": 0.10,
    "tds_rule": (
        "Indian domestic customers are permitted to deduct 10% TDS strictly on the invoice subtotal "
        "(excluding GST). The customer must submit a valid Form 16A TDS certificate to close the balance."
    ),
    "international_charges_rule": (
        "International clients are required to bear all incoming, intermediary, and wire transfer bank charges."
    ),
    "payment_extension_rule": (
        "Any request for an extension of the due date or an installment payment plan cannot be approved by AI "
        "and requires formal written approval from the Accounts Team."
    ),
    "dispute_rule": (
        "All customer disputes, pricing discrepancies, or billing queries will be reviewed and responded to "
        "within 3 business days by our finance operations desk."
    ),
    "working_hours": "Monday–Friday, 10:00–18:00 IST",
    "accounts_contact": "accounts@acmecorp.example.com"
}

def get_policy_prompt_context() -> str:
    """Returns a concise, secure text block of company policies to feed into LLM."""
    return f"""
Company Collections & Finance Policies:
1. TDS Deduction: Indian customers can deduct 10% TDS on subtotal only. TDS certificate (Form 16A) required.
2. International Bank Fees: Foreign clients must cover all bank remittance charges.
3. Due Date Extensions & Installment Plans: Can ONLY be approved by human Accounts Team. Never promise an extension.
4. Disputes: Disputed invoices are addressed within 3 working days.
5. Operating Hours: Monday to Friday, 10:00 - 18:00 IST.
Accounts Desk: accounts@acmecorp.example.com
""".strip()
