import os
import json
import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.business.policies import get_policy_prompt_context
from app.services.validation_service import validate_ai_draft_facts

logger = logging.getLogger("sonic_ai.gemini_service")

CLASSIFICATION_CATEGORIES = [
    "routine_query",
    "payment_promise",
    "payment_claim",
    "extension_request",
    "dispute",
    "legal_threat",
    "unknown_sender",
    "out_of_scope"
]

def fallback_heuristic_classifier(
    email_text: str,
    subject: str,
    sender_email: str,
    customer: Optional[Dict[str, Any]],
    invoices: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Deterministic rule-based classification and safe drafting engine when Gemini is offline or API key is absent.
    Covers all 8 categories rigorously.
    """
    text_lower = (subject + " " + email_text).lower()

    if not customer:
        return {
            "category": "unknown_sender",
            "confidence": 0.99,
            "reason": "Sender email is not associated with any customer account.",
            "draft_reply": (
                "Thank you for contacting AcmeCorp Accounts. We are unable to locate an active account "
                "associated with this email address. Please reply with your customer ID and registered company "
                "name so our finance team can assist you."
            ),
            "requires_human_review": True,
            "urgency": "normal"
        }

    # 1. Legal threat
    if any(k in text_lower for k in ["lawyer", "attorney", "legal action", "litigation", "court", "arbitration", "sue you"]):
        return {
            "category": "legal_threat",
            "confidence": 0.95,
            "reason": "Email mentions legal action or counsel.",
            "draft_reply": (
                f"Dear {customer.get('contact_name') or customer.get('name')},\n\n"
                "Thank you for your message. We have forwarded your correspondence directly to our Legal and "
                "Accounts Management team for expedited review. An authorized representative will contact you shortly."
            ),
            "requires_human_review": True,
            "urgency": "critical"
        }

    # 2. Dispute
    if any(k in text_lower for k in ["dispute", "incorrect charge", "wrong amount", "never ordered", "billing error", "wrong billing", "overcharged"]):
        return {
            "category": "dispute",
            "confidence": 0.92,
            "reason": "Customer is contesting invoice charges or accuracy.",
            "draft_reply": (
                f"Dear {customer.get('contact_name') or customer.get('name')},\n\n"
                "Thank you for bringing this to our attention. Under AcmeCorp policy, all billing disputes are "
                "thoroughly audited and responded to within 3 business days. Our Accounts Operations team has "
                "been assigned to review your statement of account.\n\n"
                "Warm regards,\nAcmeCorp Accounts Team"
            ),
            "requires_human_review": True,
            "urgency": "high"
        }

    # 3. Extension Request
    if any(k in text_lower for k in ["extension", "extend", "need more time", "pay next month", "delay payment", "installment", "pay in parts"]):
        return {
            "category": "extension_request",
            "confidence": 0.90,
            "reason": "Customer is requesting payment extension or installment terms.",
            "draft_reply": (
                f"Dear {customer.get('contact_name') or customer.get('name')},\n\n"
                "Thank you for reaching out regarding your payment schedule. In accordance with AcmeCorp finance "
                "policy, formal payment extensions and installment arrangements require approval from our Accounts Team.\n\n"
                "We have logged your request with management and will update you shortly with their decision.\n\n"
                "Warm regards,\nAcmeCorp Accounts Team"
            ),
            "requires_human_review": True,
            "urgency": "normal"
        }

    # 4. Payment Claim
    if any(k in text_lower for k in ["already paid", "payment made", "remitted", "wired the money", "transferred funds", "check attached", "utr number", "here is the receipt"]):
        return {
            "category": "payment_claim",
            "confidence": 0.88,
            "reason": "Customer claims payment has been executed. Verification needed against bank statement.",
            "draft_reply": (
                f"Dear {customer.get('contact_name') or customer.get('name')},\n\n"
                "Thank you for notifying us of your remittance. We are reconciling recent bank credits and will "
                "verify this transaction once the statement reflects the transfer.\n\n"
                "Please note that invoices are marked as paid upon verified bank clearance.\n\n"
                "Warm regards,\nAcmeCorp Accounts Team"
            ),
            "requires_human_review": False, # per assignment, acknowledge and record, don't mark paid
            "urgency": "normal"
        }

    # 5. Payment Promise
    if any(k in text_lower for k in ["will pay", "processing tomorrow", "scheduled for", "paying by friday", "will clear by", "next week"]):
        return {
            "category": "payment_promise",
            "confidence": 0.85,
            "reason": "Customer committed to a future payment date. Recorded promise without altering paid status.",
            "draft_reply": (
                f"Dear {customer.get('contact_name') or customer.get('name')},\n\n"
                "Thank you for confirming your payment timeline. We have recorded your expected payment date in our "
                "records. Please let us know if you require any updated statements or bank remittance details.\n\n"
                "Warm regards,\nAcmeCorp Accounts Team"
            ),
            "requires_human_review": False,
            "urgency": "normal"
        }

    # 6. Routine query (e.g. balance, bank details, copy of invoice)
    if any(k in text_lower for k in ["balance", "bank details", "account details", "how much do we owe", "send invoice", "copy", "statement"]):
        inv_summary = []
        for inv in invoices:
            if float(inv.get("balance_due", 0)) > 0:
                inv_summary.append(f"- Invoice {inv.get('invoice_number')}: {inv.get('currency')} {inv.get('balance_due'):,.2f} (Due: {inv.get('due_date')})")
        inv_text = "\n".join(inv_summary) if inv_summary else "You currently have no open balance with us."

        return {
            "category": "routine_query",
            "confidence": 0.90,
            "reason": "Routine inquiry regarding open invoices or bank details.",
            "draft_reply": (
                f"Dear {customer.get('contact_name') or customer.get('name')},\n\n"
                f"Here is your current statement with AcmeCorp:\n\n{inv_text}\n\n"
                "Bank Details:\n"
                "Bank: HDFC Bank Ltd | A/C: 50200012345678 | IFSC: HDFC0001234\n\n"
                "If you need any additional copies or have questions, please feel free to reach out.\n\n"
                "Warm regards,\nAcmeCorp Accounts Team"
            ),
            "requires_human_review": False,
            "urgency": "normal"
        }

    # Default: out_of_scope
    return {
        "category": "out_of_scope",
        "confidence": 0.75,
        "reason": "Inquiry is general or not related to collections.",
        "draft_reply": (
            f"Dear {customer.get('contact_name') or customer.get('name')},\n\n"
            "Thank you for reaching out to AcmeCorp. Your inquiry has been routed to the appropriate department "
            "and we will get back to you shortly.\n\n"
            "Warm regards,\nAcmeCorp Accounts Team"
        ),
        "requires_human_review": True,
        "urgency": "normal"
    }

async def classify_and_draft_reply(
    email_text: str,
    subject: str,
    sender_email: str,
    customer: Optional[Dict[str, Any]],
    customer_invoices: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Classifies inbound email using Gemini (if available) with strict fallback.
    Ensures customer data isolation: only customer's own invoices and org policies are provided.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key.startswith("your_") or len(api_key) < 10:
        logger.info("Gemini API key not configured; using deterministic rules classifier.")
        result = fallback_heuristic_classifier(email_text, subject, sender_email, customer, customer_invoices)
        return result

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(settings.GEMINI_MODEL or "gemini-1.5-flash")

        # Prepare isolated customer context
        inv_context = []
        for inv in customer_invoices:
            inv_context.append({
                "invoice_number": inv.get("invoice_number"),
                "due_date": inv.get("due_date"),
                "total": inv.get("total"),
                "balance_due": inv.get("balance_due"),
                "currency": inv.get("currency"),
                "status": inv.get("status")
            })

        prompt = f"""
You are the AI Collections Assistant for AcmeCorp India Pvt Ltd.
Analyze this inbound email from customer:
Sender: {sender_email}
Customer Info: {json.dumps(customer or {'status': 'UNKNOWN_SENDER'})}
Customer Unpaid Invoices: {json.dumps(inv_context)}

Organization Policies:
{get_policy_prompt_context()}

Rules:
1. Categories must be one of: [routine_query, payment_promise, payment_claim, extension_request, dispute, legal_threat, unknown_sender, out_of_scope].
2. Golden rule: A customer claim or promise of payment DOES NOT mark an invoice paid.
3. NEVER promise payment extensions or installments; route those to human review.
4. If unknown sender, do not reveal invoices or balances.
5. All disputes require human review within 3 working days.
6. Draft a professional, polite response. Only quote verified invoice numbers, dates, and amounts from the provided context.

Respond ONLY with valid JSON in this exact structure:
{{
  "category": "one_of_the_categories",
  "confidence": 0.95,
  "reason": "Brief reason for classification",
  "draft_reply": "Professional email body draft",
  "requires_human_review": true_or_false,
  "urgency": "normal" | "high" | "critical"
}}
Incoming Subject: {subject}
Incoming Message:
{email_text}
"""
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        parsed = json.loads(response.text)

        # Validate AI draft against facts
        is_valid, validation_errors = validate_ai_draft_facts(parsed.get("draft_reply", ""), customer_invoices)
        if not is_valid:
            logger.warning(f"AI draft validation failed: {validation_errors}. Flagging for human review.")
            parsed["requires_human_review"] = True
            parsed["validation_errors"] = validation_errors

        return parsed
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}. Falling back to deterministic classifier.")
        return fallback_heuristic_classifier(email_text, subject, sender_email, customer, customer_invoices)
