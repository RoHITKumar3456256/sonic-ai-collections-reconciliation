# Sonic AI — API Reference Documentation

All endpoints are hosted by the FastAPI service under the `/api` prefix.

---

## 1. System & Health

### `GET /api/health`
Returns health status, active database driver (live MongoDB vs mongomock in-memory), and integration configuration.

**Response:**
```json
{
  "status": "healthy",
  "app": "Sonic AI Collections & Reconciliation Engine",
  "version": "1.0.0",
  "environment": "development",
  "database_mode": "in-memory (mongomock)",
  "gemini_configured": true,
  "smtp_configured": false,
  "imap_configured": false
}
```

---

## 2. Organization Profile

### `GET /api/organization`
Retrieves AcmeCorp legal entity profile, bank details, and collections policies.

### `PUT /api/organization`
Updates organization parameters (e.g., `accounts_email`, bank details, or policy parameters).

---

## 3. Customers

### `GET /api/customers?search={query}`
Returns enterprise customer list with optional search query by name, country, or email.

### `PUT /api/customers/{customer_id}`
Updates customer contact information (e.g. testing contact email).

---

## 4. Invoices & Receivables

### `GET /api/invoices?customer_id={id}&status={status}`
Returns invoice ledger with dynamic overdue flags (`is_overdue`, `days_overdue`).

### `GET /api/invoices/overdue`
Returns strictly overdue sent invoices (`status == 'sent'`, `balance_due > 0`, `due_date < reference_date`). Explicitly excludes draft and paid invoices.

---

## 5. Collections Outbound Agent

### `POST /api/collections/remind`
Sends an outbound reminder email for an overdue invoice via live SMTP or simulated transmission.

**Request Payload:**
```json
{
  "invoice_id": "INV-1004",
  "custom_message": "Kindly submit TDS certificate if deducting 10%.",
  "override_recipient": "tester@example.com"
}
```

**Safety Enforcement:**
- Returns `HTTP 400` if invoice is in `draft` status.
- Returns `HTTP 400` if invoice is already `paid` or has zero balance.

---

## 6. Email & Reply Processing

### `POST /api/email/check-inbox`
Triggers IMAP inbox check or simulates inbound customer email reply.

**Request Payload (Simulation):**
```json
{
  "simulate_reply": {
    "sender": "billing@kestrelfoods.example.com",
    "subject": "Dispute on INV-1004",
    "body": "We dispute the billing on invoice INV-1004."
  }
}
```

---

## 7. Needs Attention Review Queue

### `GET /api/reviews?status=pending`
Returns items awaiting human review (disputes, legal threats, extensions, unknown senders).

### `POST /api/reviews/{id}/send`
Allows operator to edit AI draft and dispatch approved outbound reply.

---

## 8. Bank Reconciliation Engine

### `POST /api/reconciliation/upload`
Accepts a CSV bank statement file (multipart/form-data). Automatically parses credit/debit rows, excludes debits, deduplicates transactions, and computes match candidates.

### `GET /api/reconciliation?status={status}`
Returns reconciliation suggestions with candidate invoice, confidence score, and match reason.

### `POST /api/reconciliation/{id}/approve`
Approves suggested match. Supports `action_type`:
- `close_invoice_tds`: Closes invoice balance recognizing 10% TDS deduction.
- `leave_balance_open`: Records partial payment and keeps remaining balance open.

### `POST /api/reconciliation/{id}/reject`
Rejects candidate suggestion.

### `POST /api/reconciliation/{id}/select`
Manually associates transaction with a selected open invoice.

---

## 9. Payments & Auditing

### `GET /api/payments`
Returns verified payment receipts ledger and TDS deductions.

### `GET /api/audit-logs?limit=50`
Returns timestamped audit trail of all operator and system actions.

### `POST /api/demo/reset`
Restores pristine initial seed data and clears demo transactions.
