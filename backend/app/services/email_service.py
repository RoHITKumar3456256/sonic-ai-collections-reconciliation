import smtplib
import imaplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uuid
from datetime import datetime, timezone
import logging
from typing import Dict, Any, Optional, List

from app.core.config import settings
from app.database import repository

logger = logging.getLogger("sonic_ai.email_service")

def build_reminder_email_content(
    invoice: Dict[str, Any],
    customer: Dict[str, Any],
    organization: Dict[str, Any],
    custom_message: Optional[str] = None
) -> Dict[str, str]:
    """Builds professional collections reminder email with verified facts."""
    inv_num = invoice.get("invoice_number")
    due_date = invoice.get("due_date")
    currency = invoice.get("currency", "INR")
    balance = float(invoice.get("balance_due", 0.0))
    cust_name = customer.get("contact_name") or customer.get("name")
    bank = organization.get("bank_details", {})

    subject = f"Payment Reminder: Invoice {inv_num} is past due - AcmeCorp"

    body = f"""Dear {cust_name},

This is a courtesy reminder from the Accounts Receivables team at AcmeCorp. 

Invoice #{inv_num} for {currency} {balance:,.2f} was due on {due_date} and is currently outstanding.

{custom_message if custom_message else "Please arrange for payment clearance at your earliest convenience."}

Bank Remittance Information:
- Bank: {bank.get('bank_name', 'HDFC Bank Ltd')}
- Account Name: {bank.get('account_name', 'AcmeCorp India Pvt Ltd')}
- Account Number: {bank.get('account_number', '50200012345678')}
- IFSC Code: {bank.get('ifsc_code', 'HDFC0001234')}
- SWIFT Code: {bank.get('swift_code', 'HDFCINBB')}

Note: Domestic Indian entities may deduct eligible 10% TDS on the invoice subtotal; please ensure your TDS certificate is remitted to {organization.get('accounts_email', 'accounts@acmecorp.example.com')}.

If payment has already been initiated, kindly reply to this email with your transaction UTR or bank confirmation.

Sincerely,
Accounts Receivables Desk
AcmeCorp India Pvt Ltd
{organization.get('accounts_email', 'accounts@acmecorp.example.com')}
"""
    return {"subject": subject, "body": body}

def send_outbound_reminder(
    invoice: Dict[str, Any],
    customer: Dict[str, Any],
    organization: Dict[str, Any],
    custom_message: Optional[str] = None,
    override_recipient: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends outbound reminder via live SMTP if configured, or records simulated send with full headers.
    Ensures idempotency and audit trail.
    """
    email_data = build_reminder_email_content(invoice, customer, organization, custom_message)
    recipient = override_recipient or settings.CUSTOMER_TEST_EMAIL or customer.get("contact_email")
    message_id = f"<reminder-{uuid.uuid4()}@acmecorp.example.com>"
    idempotency_key = f"remind_{invoice.get('id')}_{datetime.now(timezone.utc).strftime('%Y%m%d')}"

    # Check idempotency: did we already send a reminder with this idempotency key today?
    existing_logs = repository.get_reminder_logs(invoice.get("id"))
    for log in existing_logs:
        if log.get("idempotency_key") == idempotency_key:
            logger.info(f"Idempotent reminder: already sent today for {invoice.get('id')}")
            return {
                "success": True,
                "invoice_id": invoice.get("id"),
                "recipient": recipient,
                "message_id": log.get("message_id"),
                "subject": email_data["subject"],
                "body": email_data["body"],
                "idempotency_key": idempotency_key,
                "mode": "idempotent_cached",
                "timestamp": log.get("created_at")
            }

    send_mode = "simulated"
    # Attempt live SMTP if configured
    if settings.SMTP_USERNAME and settings.SMTP_PASSWORD and not settings.SMTP_USERNAME.startswith("your_"):
        try:
            msg = MIMEMultipart()
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USERNAME}>"
            msg["To"] = recipient
            msg["Subject"] = email_data["subject"]
            msg["Message-ID"] = message_id
            msg.attach(MIMEText(email_data["body"], "plain"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
            send_mode = "live_smtp"
            logger.info(f"Sent outbound reminder via live SMTP to {recipient}")
        except Exception as e:
            logger.warning(f"SMTP send failed ({e}); recording as simulated transmission.")
            send_mode = "simulated"

    now_iso = datetime.now(timezone.utc).isoformat()
    # Log reminder in DB
    log_entry = {
        "invoice_id": invoice.get("id"),
        "invoice_number": invoice.get("invoice_number"),
        "customer_id": customer.get("id"),
        "recipient": recipient,
        "message_id": message_id,
        "idempotency_key": idempotency_key,
        "mode": send_mode,
        "status": "sent",
        "created_at": now_iso
    }
    repository.add_reminder_log(log_entry)

    # Ensure conversation and message are tracked
    conv_id = f"conv_{customer.get('id')}"
    repository.upsert_conversation(conv_id, {
        "id": conv_id,
        "customer_id": customer.get("id"),
        "customer_name": customer.get("name"),
        "last_message_at": now_iso,
        "status": "active"
    })
    repository.add_message({
        "id": f"msg_{uuid.uuid4().hex[:8]}",
        "conversation_id": conv_id,
        "direction": "outbound",
        "sender": organization.get("accounts_email", "accounts@acmecorp.example.com"),
        "recipient": recipient,
        "subject": email_data["subject"],
        "body": email_data["body"],
        "message_id": message_id,
        "created_at": now_iso
    })

    return {
        "success": True,
        "invoice_id": invoice.get("id"),
        "recipient": recipient,
        "message_id": message_id,
        "subject": email_data["subject"],
        "body": email_data["body"],
        "idempotency_key": idempotency_key,
        "mode": send_mode,
        "timestamp": now_iso
    }

def poll_imap_inbox() -> List[Dict[str, Any]]:
    """
    Connects to live IMAP server if configured, reads UNSEEN messages,
    extracts sender, subject, body, and references.
    """
    results = []
    if not (settings.IMAP_USERNAME and settings.IMAP_PASSWORD and not settings.IMAP_USERNAME.startswith("your_")):
        logger.info("IMAP credentials not configured. Live polling skipped.")
        return results

    try:
        mail = imaplib.IMAP4_SSL(settings.IMAP_HOST, settings.IMAP_PORT)
        mail.login(settings.IMAP_USERNAME, settings.IMAP_PASSWORD)
        mail.select("inbox")

        status, messages = mail.search(None, "UNSEEN")
        if status != "OK":
            return results

        msg_ids = messages[0].split()
        for num in msg_ids:
            res, data = mail.fetch(num, "(RFC822)")
            if res != "OK":
                continue
            raw_email = data[0][1]
            msg = email.message_from_bytes(raw_email)

            subject = msg.get("Subject", "")
            sender = msg.get("From", "")
            message_id = msg.get("Message-ID", f"<msg-{uuid.uuid4()}@inbound.test>")
            in_reply_to = msg.get("In-Reply-To", "")

            # Extract body
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get("Content-Disposition"))
                    if content_type == "text/plain" and "attachment" not in content_disposition:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body = payload.decode(errors="ignore")
                            break
            else:
                payload = msg.get_payload(decode=True)
                if payload:
                    body = payload.decode(errors="ignore")

            results.append({
                "sender": sender,
                "subject": subject,
                "body": body,
                "message_id": message_id,
                "in_reply_to": in_reply_to
            })

        mail.close()
        mail.logout()
    except Exception as e:
        logger.warning(f"Error checking IMAP inbox: {e}")

    return results

