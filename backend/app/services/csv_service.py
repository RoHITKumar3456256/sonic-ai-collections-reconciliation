import csv
import io
import uuid
import logging
from typing import List, Dict, Any, Tuple
from fastapi import UploadFile, HTTPException

logger = logging.getLogger("sonic_ai.csv_service")

REQUIRED_CSV_FIELDS = {"date", "description"}

async def parse_bank_csv_file(file: UploadFile) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Validates and parses uploaded bank statement CSV file.
    - Validates file type, size, encoding, and column headers.
    - Parses credit and debit rows.
    - Identifies debit rows and excludes them from invoice matching.
    """
    if not (file.filename.endswith(".csv") or file.content_type in ["text/csv", "application/vnd.ms-excel", "text/plain"]):
        raise HTTPException(status_code=400, detail="Invalid file format. Only CSV files (.csv) are accepted.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum CSV size is 5MB.")

    try:
        decoded = contents.decode("utf-8-sig") # handles optional BOM
    except UnicodeDecodeError:
        try:
            decoded = contents.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to decode CSV file. Must be UTF-8 or Latin-1 encoded.")

    reader = csv.DictReader(io.StringIO(decoded))
    headers = [h.strip().lower() for h in (reader.fieldnames or [])]
    
    # Check required fields
    if not REQUIRED_CSV_FIELDS.issubset(set(headers)):
        missing = REQUIRED_CSV_FIELDS - set(headers)
        raise HTTPException(
            status_code=400,
            detail=f"Missing required CSV column headers: {', '.join(missing)}. Required: date, description, and credit/debit."
        )

    parsed_transactions = []
    total_rows = 0
    debit_rows_count = 0
    credit_rows_count = 0

    for idx, raw_row in enumerate(reader):
        total_rows += 1
        # Normalize keys
        row = {k.strip().lower(): v.strip() if isinstance(v, str) else v for k, v in raw_row.items() if k}

        date_val = row.get("date", "")
        desc_val = row.get("description", "")
        ref_val = row.get("reference") or f"TXN_{uuid.uuid4().hex[:8].upper()}"
        curr_val = (row.get("currency") or "INR").upper()

        credit_raw = row.get("credit", "")
        debit_raw = row.get("debit", "")

        credit_amount = 0.0
        debit_amount = 0.0

        if credit_raw:
            try:
                credit_amount = float(credit_raw.replace(",", ""))
            except ValueError:
                credit_amount = 0.0

        if debit_raw:
            try:
                debit_amount = float(debit_raw.replace(",", ""))
            except ValueError:
                debit_amount = 0.0

        # Check explicit debit indicator in description
        is_debit = debit_amount > 0 or "(debit)" in desc_val.lower()

        if is_debit:
            debit_rows_count += 1
        else:
            credit_rows_count += 1

        parsed_transactions.append({
            "id": f"txn_{uuid.uuid4().hex[:8]}",
            "date": date_val,
            "description": desc_val,
            "reference": ref_val,
            "credit": credit_amount,
            "debit": debit_amount if is_debit else None,
            "currency": curr_val,
            "is_debit": is_debit,
            "row_index": idx + 1
        })

    summary = {
        "filename": file.filename,
        "total_rows_parsed": total_rows,
        "credit_transactions_count": credit_rows_count,
        "debit_transactions_excluded": debit_rows_count
    }

    return parsed_transactions, summary

