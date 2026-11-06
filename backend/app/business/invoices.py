from datetime import datetime
from typing import Dict, Any, Optional

def parse_date(date_str: str) -> datetime:
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except Exception:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00")).replace(tzinfo=None)

def calculate_overdue_status(invoice: Dict[str, Any], reference_date_str: str) -> Dict[str, Any]:
    """
    Overdue dynamic rule from assignment:
    Invoice is overdue IF:
      - status == 'sent'
      - balance_due > 0
      - due_date < reference_date
    Draft, paid, or void invoices are NEVER overdue.
    """
    ref_date = parse_date(reference_date_str)
    inv_due = parse_date(invoice.get("due_date", "2099-01-01"))
    status = invoice.get("status", "sent").lower()
    balance = float(invoice.get("balance_due", 0.0))

    if status == "sent" and balance > 0 and inv_due < ref_date:
        days_overdue = (ref_date - inv_due).days
        return {
            "is_overdue": True,
            "days_overdue": max(0, days_overdue)
        }
    return {
        "is_overdue": False,
        "days_overdue": 0
    }
