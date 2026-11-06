import re
from datetime import datetime
from rapidfuzz import fuzz
from typing import Dict, Any, Tuple

# Common legal and corporate noise words to strip for clean entity matching
NOISE_TERMS = [
    r'\bpvt\b', r'\bltd\b', r'\bprivate\b', r'\blimited\b', r'\binc\b',
    r'\bincorporated\b', r'\bgmbh\b', r'\bab\b', r'\bcorp\b', r'\bcorporation\b',
    r'\bllc\b', r'\bco\b', r'\bcompany\b', r'\bservices\b', r'\bsolutions\b',
    r'\binnovations\b', r'\bpart payment\b', r'\bpayment\b', r'\bdues\b',
    r'\boct dues\b', r'\bclinic dues\b', r'\bneft\b', r'\brtgs\b', r'\bimps\b',
    r'\bupi\b', r'\btxn\b', r'\binv\b'
]

# Common abbreviations mapping
ABBREVIATIONS = {
    r'\bpkg\b': 'packaging',
    r'\bhosp\b': 'hospital',
    r'\bintl\b': 'international',
    r'\bmgmt\b': 'management',
    r'\btech\b': 'technologies',
    r'\btech innovations\b': 'tech'
}

def normalize_text(text: str) -> str:
    """Removes punctuation, extra spaces, corporate entity suffixes, and expands abbreviations."""
    if not text:
        return ""
    cleaned = text.lower()
    cleaned = re.sub(r'[/\\,\-_:;()\[\]\.]', ' ', cleaned)
    for term in NOISE_TERMS:
        cleaned = re.sub(term, ' ', cleaned)
    for abbr, full in ABBREVIATIONS.items():
        cleaned = re.sub(abbr, full, cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def extract_invoice_hints(description: str) -> list[str]:
    """Finds invoice numbers like INV 1004, INV-1002, RE 1024, etc."""
    hints = []
    # matches INV 1004, INV1004, INV-1004, RE 1024
    matches = re.findall(r'(?:INV|RE|BILL)[\s\-_]?([0-9]{3,5})', description, flags=re.IGNORECASE)
    for m in matches:
        hints.append(f"INV-{m}")
        hints.append(m)
    return hints

def calculate_match_score(
    transaction: Dict[str, Any],
    invoice: Dict[str, Any],
    customer: Dict[str, Any]
) -> Tuple[float, Dict[str, Any]]:
    """
    Computes deterministic match confidence score [0.0 to 1.0] using 5 calibrated signals:
    1. Invoice Number Match (30% weight)
    2. Payer Name Similarity (30% weight)
    3. Amount Similarity (25% weight) - checks exact, TDS-adjusted, partial
    4. Date Proximity (10% weight)
    5. Currency Match (5% weight) - HARD REJECT on mismatch
    """
    txn_desc = transaction.get("description", "")
    txn_curr = transaction.get("currency", "INR").upper().strip()
    inv_curr = invoice.get("currency", "INR").upper().strip()

    # Signal 5: Currency match (Hard reject / Severe penalty)
    if txn_curr != inv_curr:
        return 0.0, {
            "invoice_number_score": 0.0,
            "payer_name_score": 0.0,
            "amount_score": 0.0,
            "date_proximity_score": 0.0,
            "currency_score": 0.0,
            "total_confidence": 0.0,
            "match_type": "currency_mismatch",
            "match_notes": f"Currency mismatch: Txn is {txn_curr}, Invoice is {inv_curr}"
        }

    currency_score = 1.0

    # Signal 1: Invoice Number / Reference (30%)
    inv_num = invoice.get("invoice_number", "").upper()
    clean_inv_num = inv_num.replace("-", "").replace(" ", "")
    inv_hints = extract_invoice_hints(txn_desc)
    inv_num_score = 0.0

    if any(h.upper() in inv_num or h.upper() in clean_inv_num for h in inv_hints):
        inv_num_score = 1.0
    elif clean_inv_num in txn_desc.upper().replace("-", "").replace(" ", "").replace("/", ""):
        inv_num_score = 1.0
    else:
        # Check partial numeric match
        inv_digits = re.findall(r'\d+', inv_num)
        if inv_digits and any(d in txn_desc for d in inv_digits):
            inv_num_score = 0.8

    # Signal 2: Payer Name Similarity (30%)
    cust_name = customer.get("name", "") if customer else invoice.get("customer_name", "")
    norm_cust = normalize_text(cust_name)
    norm_txn = normalize_text(txn_desc)

    payer_name_score = 0.0
    if norm_cust and norm_txn:
        # RapidFuzz token_set_ratio handles reordered words and partial substrings
        token_ratio = fuzz.token_set_ratio(norm_cust, norm_txn) / 100.0
        partial_ratio = fuzz.partial_ratio(norm_cust, norm_txn) / 100.0
        payer_name_score = max(token_ratio, partial_ratio)
        if payer_name_score < 0.35:
            payer_name_score = 0.0

    # Signal 3: Amount Similarity (25%)
    # Evaluate exact match, TDS-adjusted match (subtotal * 0.90 + tax), or partial match
    txn_amount = float(transaction.get("credit", 0.0))
    inv_total = float(invoice.get("total", 0.0))
    inv_balance = float(invoice.get("balance_due", 0.0))
    subtotal = float(invoice.get("subtotal", inv_total))
    tax = float(invoice.get("tax", 0.0))

    amount_score = 0.0
    match_type = "amount_diff"
    suggested_action = "leave_balance_open"
    tds_diff = 0.0

    # Case A: Exact balance or total match (within 0.50 unit)
    if abs(txn_amount - inv_balance) < 0.50 or abs(txn_amount - inv_total) < 0.50:
        amount_score = 1.0
        match_type = "exact_match"
        suggested_action = "full_settlement"

    # Case B: TDS-adjusted match (10% of subtotal deducted)
    # Expected receipt = (subtotal - 10% subtotal) + tax
    expected_tds_receipt = (subtotal * 0.90) + tax
    if abs(txn_amount - expected_tds_receipt) < 1.0:
        amount_score = 0.95
        match_type = "tds_adjusted"
        suggested_action = "close_invoice_tds"
        tds_diff = round(subtotal * 0.10, 2)

    # Case C: Valid partial payment (amount is strictly less than balance)
    elif 0 < txn_amount < inv_balance and not match_type.startswith("exact"):
        ratio = txn_amount / inv_balance
        amount_score = 0.70  # strong partial match
        match_type = "partial_payment"
        suggested_action = "leave_balance_open"

    # Signal 4: Date Proximity (10%)
    date_score = 0.5
    try:
        t_date = datetime.strptime(transaction.get("date", "2026-01-01"), "%Y-%m-%d")
        i_date = datetime.strptime(invoice.get("due_date", "2026-01-01"), "%Y-%m-%d")
        delta_days = abs((t_date - i_date).days)
        if delta_days <= 15:
            date_score = 1.0
        elif delta_days <= 45:
            date_score = 0.8
        elif delta_days <= 90:
            date_score = 0.5
        else:
            date_score = 0.2
    except Exception:
        date_score = 0.5

    # Weighted calculation
    # Weights: Inv Number (30%), Payer Name (30%), Amount (25%), Date (10%), Currency (5%)
    total_confidence = (
        (inv_num_score * 0.30) +
        (payer_name_score * 0.30) +
        (amount_score * 0.25) +
        (date_score * 0.10) +
        (currency_score * 0.05)
    )

    # Boost confidence if both exact invoice number AND amount match
    if inv_num_score == 1.0 and amount_score >= 0.95:
        total_confidence = max(total_confidence, 0.98)
    elif inv_num_score == 1.0 and payer_name_score > 0.6:
        total_confidence = max(total_confidence, 0.92)
    elif payer_name_score >= 0.70 and match_type == "tds_adjusted":
        total_confidence = max(total_confidence, 0.85)
    elif payer_name_score >= 0.70 and match_type == "partial_payment":
        total_confidence = max(total_confidence, 0.78)
    elif payer_name_score >= 0.75 and amount_score >= 0.95:
        total_confidence = max(total_confidence, 0.88)

    notes = []
    if inv_num_score > 0.7:
        notes.append("Invoice number cited in description")
    if payer_name_score > 0.6:
        notes.append(f"Payer name match ({int(payer_name_score*100)}%)")
    if match_type == "exact_match":
        notes.append("Exact amount match")
    elif match_type == "tds_adjusted":
        notes.append(f"Matches subtotal less 10% TDS (INR {tds_diff:,.2f})")
    elif match_type == "partial_payment":
        notes.append("Partial payment of invoice balance")

    breakdown = {
        "invoice_number_score": round(inv_num_score, 2),
        "payer_name_score": round(payer_name_score, 2),
        "amount_score": round(amount_score, 2),
        "date_proximity_score": round(date_score, 2),
        "currency_score": round(currency_score, 2),
        "total_confidence": round(total_confidence, 2),
        "match_type": match_type,
        "suggested_action": suggested_action,
        "tds_amount": tds_diff,
        "match_notes": " • ".join(notes) if notes else "Low similarity"
    }

    return round(total_confidence, 2), breakdown
