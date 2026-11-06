# Sonic AI — System Architecture & Design Specification

Sonic AI is an enterprise B2B Collections Intelligence and Deterministic Bank Statement Reconciliation platform built for **AcmeCorp India Pvt Ltd**.

---

## 1. High-Level System Architecture

```
[ B2B React 18 + TS + Tailwind Client ]
                  │
                  ▼  (REST / JSON API)
     [ FastAPI Backend Service ]
       │              │              │
       ▼              ▼              ▼
 [ PyMongo Repository ] [ Collections Agent ] [ Reconciliation Engine ]
   ├── MongoDB Atlas     ├── Fact Validator     ├── RapidFuzz String Matcher
   └── mongomock         ├── Gemini LLM Client  ├── TDS 10% Calculator
                         └── SMTP / IMAP Trans  └── Idempotent Approval Desk
```

### Key Architectural Tenets
1. **Frontend-Backend Separation**: The frontend has no direct access to MongoDB, SMTP/IMAP, or the Gemini API. All business logic, fact checks, and secret keys reside in FastAPI.
2. **Deterministic Financial Operations**: Critical financial actions (payment application, invoice balance changes, debit exclusion, currency validation) are computed deterministically. LLMs are never used to blindly decide balances or payments.
3. **Customer Data Isolation**: Prompts sent to Gemini contain strictly the policies and invoices of the matched customer. Full customer databases and foreign invoices are never disclosed.
4. **Human-in-the-Loop Governance**: Sensitive decisions (disputes, legal threats, payment extensions, partial settlement approvals) require explicit human review.

---

## 2. Collections Agent & Email Intelligence Workflow

```
[Inbound Email Received] 
        │
        ▼
[Extract Sender & Headers (In-Reply-To, Message-ID)]
        │
        ▼
[Match Customer in MongoDB Ground Truth]
        ├── Known Customer  ──► Isolate that customer's unpaid invoices
        └── Unknown Sender  ──► Route to Needs Attention; ZERO financial data disclosed
        │
        ▼
[LLM Classification (Gemini / Heuristic Engine)]
        ├── routine_query      ──► Draft/Auto-reply quoting real balance & HDFC Bank
        ├── payment_promise    ──► Acknowledge promise; KEEP invoice unpaid
        ├── payment_claim      ──► Acknowledge UTR; require reconciliation before clearing
        ├── extension_request  ──► Needs Attention (Accounts Team approval required)
        ├── dispute            ──► Needs Attention (3-day SLA review)
        ├── legal_threat       ──► Urgent Needs Attention (Legal review)
        └── out_of_scope       ──► Route safely
        │
        ▼
[Fact Verification Gate]
        ├── Mentions non-existent invoice? ──► REJECT AUTO-SEND, Flag for human
        ├── Falsely claims balance is zero? ──► REJECT AUTO-SEND, Flag for human
        └── Unauthorized extension commit?  ──► REJECT AUTO-SEND, Flag for human
```

---

## 3. Bank Statement Reconciliation Engine

Reconciliation processes bank statement rows without sending financial data to third-party LLMs.

### 5-Signal Deterministic Matching Formula

$$\text{Confidence Score} = w_{\text{inv}} S_{\text{inv}} + w_{\text{name}} S_{\text{name}} + w_{\text{amt}} S_{\text{amt}} + w_{\text{date}} S_{\text{date}} + w_{\text{curr}} S_{\text{curr}}$$

| Signal | Weight | Logic & Engineering Implementation |
|---|---|---|
| **Invoice Reference** | 30% | Regex extraction for `INV-XXXX`, `RE-XXXX`, or numeric tokens in description. |
| **Payer Similarity** | 30% | Noise words removed (`PVT LTD`, `CORP`, `RTGS`, `DUES`). Fuzzy matching via RapidFuzz `token_set_ratio`. |
| **Amount Similarity** | 25% | Categorizes exact balance matches, valid partial payments ($< \text{balance}$), and Indian 10% TDS deductions on subtotal: $\text{Expected Receipt} = (\text{Subtotal} \times 0.90) + \text{Tax}$. |
| **Date Proximity** | 10% | Compares transaction date against invoice due date ($\le 15$d: 1.0, $\le 45$d: 0.8, $\le 90$d: 0.5). |
| **Currency Match** | 5% | Hard check: Currency mismatch zeroes the total match score. |

### Exclusion & Safety Rules
- **Debit Exclusion**: Debit entries (e.g. office rent, software vendor) are excluded from receipt matching.
- **Deduplication**: Bank statement rows are keyed by their transaction reference; duplicate imports are ignored.
- **Idempotent Approvals**: Re-clicking an approval executes an idempotency check, returning the existing payment record without double-deducting.

