# Sonic AI Test Dataset Explanation

This dataset models **AcmeCorp India Pvt Ltd** and its receivables across domestic (INR) and international (USD, EUR, GBP) enterprise customers.

## 1. Customers (`customers.json`)
- **Domestic Customers (India)**:
  - `CUST-001` (Kestrel Foods Ltd)
  - `CUST-002` (Orbis Packaging Solutions)
  - `CUST-003` (Quillon Tech Innovations)
  - `CUST-006` (Brightline Logistics Pvt Ltd)
  - `CUST-007` (Redwood Medical Clinic)
  - `CUST-009` (Saffron Peak Hospital)
  - `CUST-010` (R K Sharma Clinics)
  - `CUST-011` (Maple Retail Services)
- **International Customers**:
  - `CUST-004` (Nordlys Retail AB - Sweden, EUR)
  - `CUST-005` (Harbour Analytics Inc - USA, USD)
  - `CUST-008` (Thornfield Media UK Ltd - UK, GBP)

## 2. Invoices (`invoices.json`)
The invoices reflect key business and collections states:
1. **Overdue Sent Invoices**: Overdue based on dynamic rule (`status == 'sent'`, `balance_due > 0`, `due_date < current_date`). Examples: `INV-1001`, `INV-1002`, `INV-1003`, `INV-1004`, `INV-1005`, `INV-1008`, `INV-1009`, `INV-1010`, `INV-1021`, `INV-1022`, `INV-1024`.
2. **Paid Invoice (`INV-1012`)**: `status: 'paid'`, `balance_due: 0`. MUST NOT receive reminder chasing.
3. **Draft Invoice (`INV-1015`)**: `status: 'draft'`. MUST NOT receive reminder chasing.
4. **Future Due Date Invoice (`INV-1016`)**: `status: 'sent'`, but due date in December 2026. Active, not overdue.

## 3. Bank Statement Cases (`bank_statement_sample.csv`)
14 total statement rows exercising all reconciliation engine logic:
1. **Exact Reference & Amount Match**: `2026-09-05`, `KESTREL FOODS / INV 1004`, 59,000 INR -> exact match `INV-1004`.
2. **Partial Payment**: `2026-09-10`, `ORBIS PKG / PART PAYMENT`, 200,000 INR -> matches `INV-1003` (Balance: 295,000). System prompts human to leave balance open.
3. **TDS Adjusted Domestic Receipt**: `2026-09-21`, `QUILLON TECH`, 324,000 INR -> matches `INV-1001` (Subtotal 300,000 + GST 54,000 = 354,000; 10% TDS on subtotal = 30,000; net expected receipt = 324,000). System provides option to close invoice with TDS deduction.
4. **International Invoices**:
   - `2026-09-25`: `NORDLYS RETAIL / RE 1024` 9,200 EUR -> matches `INV-1024`.
   - `2026-09-28`: `HARBOUR ANALYTICS / INV1021` 12,500 USD -> matches `INV-1021`.
   - `2026-10-08`: `THORNFIELD MEDIA` 7,350.50 GBP -> matches `INV-1022`.
5. **Name Similarity / Reference Matching**:
   - `2026-09-30`: `BRIGHTLINE LOGISTICS / INV-1002` 236,000 INR -> matches `INV-1002`.
   - `2026-10-02`: `REDWOOD CLINIC` 59,000 INR -> matches `INV-1005`.
   - `2026-10-12`: `SAFFRON PEAK HOSP / OCT DUES` 194,700 INR -> matches `INV-1008`.
   - `2026-10-20`: `R K SHARMA / CLINIC DUES` 88,500 INR -> matches `INV-1009`.
   - `2026-10-24`: `MAPLE RETAIL SERVICES` 12,750 INR -> matches `INV-1010`.
6. **Debit Exclusions**:
   - `2026-10-05`: `OFFICE RENT OCT (debit)` 45,000 INR debit. Excluded from receipt matching.
   - `2026-10-15`: `SOFTWARE VENDOR (debit)` 1,200 USD debit. Excluded from receipt matching.
7. **Non-Customer Receipt (No Match)**:
   - `2026-10-31`: `INTEREST PAID` 431.22 INR -> Flags as "No match found".
