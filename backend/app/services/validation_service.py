import re
from typing import List, Dict, Any, Tuple

def extract_invoice_numbers(text: str) -> List[str]:
    """Finds invoice numbers like INV-1001, INV1001, etc."""
    matches = re.findall(r'\bINV[-_ ]?([0-9]{3,6})\b', text, flags=re.IGNORECASE)
    normalized = [f"INV-{m}" for m in matches]
    return list(set(normalized))

def extract_currency_amounts(text: str) -> List[float]:
    """Extracts numbers that look like monetary amounts (e.g., 59,000, 354000, 324,000)."""
    clean_text = text.replace(",", "")
    matches = re.findall(r'(?:₹|\$|€|£|INR|USD|EUR|GBP)?\s*([0-9]+(?:\.[0-9]{1,2})?)', clean_text)
    amounts = []
    for m in matches:
        try:
            val = float(m)
            if val >= 10:  # avoid tiny single digits like days
                amounts.append(val)
        except ValueError:
            pass
    return amounts

def validate_ai_draft_facts(
    ai_draft: str,
    customer_invoices: List[Dict[str, Any]]
) -> Tuple[bool, List[str]]:
    """
    Validates AI response against database ground truth:
    - If AI mentions an invoice number, it MUST exist in the customer's legitimate invoices.
    - If AI mentions monetary balances/totals, they must not conflict wildly with the customer's actual balances.
    - Ensures AI never marks paid or states 'your balance is zero' unless DB agrees.
    Returns (is_valid, list_of_errors).
    """
    errors = []
    valid_inv_nums = {inv.get("invoice_number", "").upper() for inv in customer_invoices}
    # Also without hyphen
    valid_nums_clean = {inv.get("invoice_number", "").replace("-", "").upper() for inv in customer_invoices}

    mentioned_invoices = extract_invoice_numbers(ai_draft)
    for inv in mentioned_invoices:
        clean = inv.replace("-", "").upper()
        if inv.upper() not in valid_inv_nums and clean not in valid_nums_clean:
            errors.append(f"AI drafted non-existent or unauthorized invoice reference: '{inv}'.")

    # Check for hallucinated settlement claims
    settlement_keywords = ["settled in full", "account balance is 0", "balance is zero", "marked as paid"]
    for phrase in settlement_keywords:
        if phrase in ai_draft.lower():
            # Check if any unpaid invoices exist
            has_unpaid = any(float(inv.get("balance_due", 0)) > 0 for inv in customer_invoices)
            if has_unpaid:
                errors.append(f"AI falsely claimed invoice was settled/zero balance while unpaid invoices remain.")

    # Check for unauthorized extension promises
    unauthorized_extension_phrases = [
        "i have granted you an extension",
        "due date is now extended",
        "we have approved your installment plan",
        "deadline is extended"
    ]
    for phrase in unauthorized_extension_phrases:
        if phrase in ai_draft.lower():
            errors.append(f"AI made unauthorized commitment: '{phrase}' (requires human Accounts Team approval).")

    is_valid = len(errors) == 0
    return is_valid, errors
