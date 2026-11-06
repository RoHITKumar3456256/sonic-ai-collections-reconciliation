# Sonic AI — Collections & Bank Reconciliation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-PyMongo_/_mongomock-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-API_with_Fallback-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Tests](https://img.shields.io/badge/Tests-14_Passed_100%25-brightgreen)](https://docs.pytest.org)

An enterprise-grade B2B accounts receivable collections assistant and deterministic bank statement reconciliation engine built for **AcmeCorp India Pvt Ltd**.

---

## 🚀 Key Capabilities

1. **Dynamic Overdue Receivables**: Dynamic overdue calculation (`status == 'sent'`, `balance_due > 0`, `due_date < reference_date`). Draft and paid invoices are strictly barred from reminder chasing.
2. **Context-Isolated AI Reply Classification**: Evaluates customer replies across 8 standard categories (`routine_query`, `payment_promise`, `payment_claim`, `extension_request`, `dispute`, `legal_threat`, `unknown_sender`, `out_of_scope`). Gemini receives only that specific customer's invoices and policies.
3. **Ground Truth Fact Verification**: Cross-references every AI drafted invoice number, balance, and date against MongoDB ground truth. Prevents hallucinations and unauthorized payment extension commitments.
4. **The Golden Rule**: Customer payment claims or promises **never** mark an invoice paid. Only human-approved bank reconciliation clears receivables.
5. **Deterministic Bank Statement Reconciliation**: 5-signal calibrated scoring engine (Invoice # 30%, Payer Name 30%, Amount 25%, Date 10%, Currency 5%). Calculates 10% TDS deductions on subtotal for Indian entities, excludes debit rows, and enforces idempotent human approvals.
6. **Zero-Config Evaluation**: Automatic fallback to in-memory `mongomock` and deterministic NLP rule engine allows instant local evaluation even without live MongoDB or Gemini API keys!

---

## 📁 Repository Structure

```
Sonic.AI/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # REST endpoints (health, invoices, collections, reviews, recon, demo)
│   │   ├── core/              # Config, settings, logging
│   │   ├── database/          # PyMongo & mongomock fallback repository
│   │   ├── models/ & schemas/ # Pydantic v2 validation models
│   │   ├── services/          # Gemini LLM, email SMTP/IMAP, CSV parser, fact validator
│   │   ├── agents/            # Collections agent & reply routing
│   │   ├── reconciliation/    # RapidFuzz multi-signal matcher & scorer
│   │   └── business/          # Overdue logic & AcmeCorp financial policies
│   ├── tests/                 # Comprehensive pytest suite (14 passing tests)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # Layout, Navbar, Sidebar
│   │   ├── pages/             # Dashboard, Invoices, Collections, Reviews, Recon, Payments, Customers
│   │   ├── services/api.ts    # Typed API client
│   │   └── types/             # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── data/
│   ├── organization.json      # AcmeCorp profile, bank coordinates & policies
│   ├── customers.json         # 11 domestic & international accounts
│   ├── invoices.json          # 14 invoices (overdue, sent, paid, draft)
│   ├── bank_statement_sample.csv # 14 statement rows (credits, debits, TDS)
│   └── data-explanation.md
├── docs/
│   ├── architecture.md        # Architecture specification & data flow
│   ├── api.md                 # Complete API documentation
│   ├── explanation.md         # Implementation explanation
│   └── explanation.pdf        # Formatted PDF assignment deliverable
├── scripts/
│   ├── seed_database.py       # Standalone database seeder
│   └── generate_explanation_pdf.py # ReportLab PDF generator
├── .env.example
├── .gitignore
└── README.md
```

---

## 🛠️ Quickstart Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- (Optional) MongoDB Atlas or local MongoDB instance (mongomock is used automatically if offline)

### 1. Backend Setup
```bash
# From project root
python -m venv backend/venv

# Activate venv:
# Windows (PowerShell):
.\backend\venv\Scripts\Activate.ps1
# Mac / Linux:
source backend/venv/bin/activate

# Install dependencies:
pip install -r backend/requirements.txt

# (Optional) Copy environment template:
cp .env.example .env

# Seed initial database:
python scripts/seed_database.py

# Start FastAPI backend:
uvicorn app.main:app --app-dir backend --reload --port 8000
```
Backend runs at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend:
cd frontend

# Install npm dependencies:
npm install

# Start Vite dev server:
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 🧪 Running Automated Tests

Run the backend test suite:
```bash
.\backend\venv\Scripts\pytest backend\tests
```
**Results:** `14 passed in 3.75s` (100% test passing rate covering dynamic overdue calculation, fact validation, TDS matching, debit exclusion, and idempotent approvals).

---

## 🎬 3-Minute Demo Video Walkthrough

Recommended demonstration recording flow:

| Timestamp | Screen | Key Demonstration Action |
|---|---|---|
| **0:00 – 0:20** | **Dashboard** | Overview of AcmeCorp accounts receivable: Total Overdue (₹1,263,950), Total Outstanding, Collected receipts, and active policy indicators. |
| **0:20 – 0:50** | **Organization & Invoices** | Show company profile, HDFC Bank details, and 10% TDS policy. In Invoices tab, filter by 'overdue', 'paid' (`INV-1012`), and 'draft' (`INV-1015`) to demonstrate dynamic calculation. |
| **0:50 – 1:25** | **Collections & Conversations** | Dispatch a reminder for `INV-1004` (Kestrel Foods). Open Conversations tab and click "Simulate Customer Reply" with a Billing Dispute. |
| **1:25 – 1:55** | **Needs Attention Queue** | Show dispute escalated to human review (3-day SLA). Review the AI drafted response, make an operator edit, and click "Authorize & Send Email". |
| **1:55 – 2:40** | **Bank Reconciliation** | Click "Load 14-Row Assignment CSV". Show 2 debit rows excluded automatically. Demonstrate Quillon Tech (₹324,000) matched with 10% TDS deduction on subtotal (₹300,000). Click "Approve: Close with TDS". |
| **2:40 – 3:00** | **Payment Ledger & Audit Trail** | Show updated invoice balance (0.00 / Paid), new payment receipt in ledger with ₹30,000 TDS recorded, and summarize safety controls. |

---

## 🔒 Security & Governance Checklist

- [x] **No Secrets in Repo**: All credentials read strictly from environment variables (`.env.example` committed).
- [x] **Customer Context Isolation**: Prompts receive strictly the customer's own invoices and org policies.
- [x] **Fact Validation Gate**: AI responses with non-existent invoice numbers or unauthorized extension promises are intercepted.
- [x] **Debit Exclusions**: Debit bank rows (office rent, software vendor) are barred from receipt matching.
- [x] **Idempotency**: Repetitive reminder sends or approval clicks do not duplicate payments or spam customers.
- [x] **Audit Trail**: Every customer update, outbound reminder, and reconciliation decision is logged.
