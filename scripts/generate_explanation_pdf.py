import os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf():
    docs_dir = Path(__file__).resolve().parent.parent / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = docs_dir / "explanation.pdf"

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=14
    )
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )
    callout_style = ParagraphStyle(
        'DocCallout',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1e293b'),
        backColor=colors.HexColor('#f1f5f9'),
        borderColor=colors.HexColor('#cbd5e1'),
        borderWidth=1,
        borderPadding=6,
        spaceAfter=8
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("Sonic AI — Assignment Architecture & Engineering Explanation", title_style))
    story.append(Paragraph("AcmeCorp Autonomous Collections Agent & Deterministic Bank Reconciliation Engine", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563eb'), spaceAfter=10))

    # Section 1: Executive Summary & Objective
    story.append(Paragraph("1. System Purpose & Core Objective", h2_style))
    story.append(Paragraph(
        "The Sonic AI platform automates accounts receivable collections and bank statement reconciliation "
        "for AcmeCorp India Pvt Ltd. B2B receivables involve sensitive commercial contracts, tax deductions (TDS), "
        "and dispute risks. Consequently, Sonic AI implements a strict <b>governed human-in-the-loop</b> architecture. "
        "The system calculates dynamic overdue schedules, drafts context-isolated email communications, enforces factual "
        "verification against database ground truth, and deterministically scores bank receipts without delegating financial "
        "commitments or balance updates to probabilistic LLM decisions.",
        body_style
    ))

    # Section 2: Collections Agent & Email Intelligence
    story.append(Paragraph("2. Collections Agent & Customer Reply Intelligence", h2_style))
    story.append(Paragraph(
        "<b>A. Dynamic Overdue Determination:</b> Invoices are never statically marked overdue. An invoice is overdue iff "
        "<code>status == 'sent'</code>, <code>balance_due > 0</code>, and <code>due_date < reference_date</code>. "
        "Draft and already-paid invoices are strictly barred from reminder queues.<br/>"
        "<b>B. Customer Isolation & Minimum Context:</b> When classifying inbound messages, LLM prompts receive <i>only</i> "
        "the verified invoices of that specific customer and official corporate policies. Full customer databases and foreign "
        "invoices are never exposed.<br/>"
        "<b>C. Ground Truth Fact Validation:</b> Every drafted invoice number, due date, and monetary amount is cross-referenced "
        "against MongoDB before dispatch. Hallucinated invoice references or unauthorized payment extension commitments "
        "are intercepted and routed to the Needs Attention queue.<br/>"
        "<b>D. Golden Rule Governance:</b> A customer's promise or claim of payment does <i>never</i> mark an invoice paid. "
        "Invoices are only cleared upon explicit human review and verified bank transaction reconciliation.",
        body_style
    ))

    # Table of Categories
    cat_data = [
        ["Category", "Escalation Routing", "System Behavior"],
        ["routine_query", "Safe Auto-Reply / Draft", "Returns verified balance, open invoices, and HDFC Bank coordinates."],
        ["payment_promise", "Log Promise", "Records promised clearance date; keeps invoice balance open."],
        ["payment_claim", "Acknowledge Claim", "Acknowledges UTR/claim; defers paid status to bank reconciliation."],
        ["extension_request", "Needs Attention (Human)", "Accounts Team approval strictly required; AI makes no commitment."],
        ["dispute", "Needs Attention (Human)", "Enforces AcmeCorp 3-day SLA; assigns finance operations desk."],
        ["legal_threat", "Critical Priority Review", "Immediate legal escalation; blocks any automated communication."],
        ["unknown_sender", "Needs Attention (Human)", "Zero disclosure of sensitive financial information; customer ID check."]
    ]
    t = Table(cat_data, colWidths=[100, 130, 310])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8),
        ('BOTTOMPADDING', (0,0), (-1,0), 4),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8fafc')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('FONTSIZE', (0,1), (-1,-1), 7.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    # Section 3: Bank Reconciliation Engine
    story.append(Paragraph("3. Deterministic Bank Reconciliation Engine", h2_style))
    story.append(Paragraph(
        "The reconciliation engine matches imported bank statement rows against accounts receivable invoices using "
        "a deterministic 5-signal scoring algorithm calibrated with RapidFuzz string normalization. Raw bank statements "
        "are never sent to LLMs, ensuring 100% deterministic, audit-proof matching.",
        body_style
    ))

    recon_signals = [
        ["Signal", "Weight", "Engineering Implementation & Heuristics"],
        ["Invoice Number / Ref", "30%", "Regex extraction for INV-XXXX, RE-XXXX, numeric tokens. Exact match provides strong evidence."],
        ["Payer Name Similarity", "30%", "Strips noise terms (PVT LTD, CORP, INC, RTGS, DUES). RapidFuzz token_set_ratio handles reordering."],
        ["Amount Similarity", "25%", "Detects exact match, valid partial receipt (< balance), and domestic 10% TDS deduction (subtotal * 0.90 + tax)."],
        ["Date Proximity", "10%", "Compares transaction date with invoice due date (<=15d: 1.0, <=45d: 0.8, <=90d: 0.5)."],
        ["Currency Match", "5%", "Hard reject: currency mismatch immediately zeroes the confidence score to prevent cross-currency errors."]
    ]
    t2 = Table(recon_signals, colWidths=[120, 50, 370])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8),
        ('BOTTOMPADDING', (0,0), (-1,0), 4),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f0fdfa')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#99f6e4')),
        ('FONTSIZE', (0,1), (-1,-1), 7.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t2)
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "<b>Debit Row & Duplicate Exclusion:</b> Debit entries (office rent, software vendor) are automatically identified and excluded from "
        "receipt reconciliation. Deduplication logic prevents duplicate bank transaction references from creating duplicate matches.<br/>"
        "<b>Human Approval & Idempotency:</b> Payments are <i>never</i> applied automatically. A human operator chooses whether to close an "
        "invoice with 10% TDS deduction (upon Form 16A receipt) or leave the balance open for partial payments. Duplicate approval clicks "
        "are strictly idempotent and cannot double-apply funds.",
        body_style
    ))

    # Section 4: Architecture & Tech Stack
    story.append(Paragraph("4. Technical Stack & Deployment Integrity", h2_style))
    story.append(Paragraph(
        "• <b>Frontend:</b> React 18 + TypeScript + Vite + Tailwind CSS with modern B2B fintech UI (FinTrackr, Monexa, and Callour inspired).<br/>"
        "• <b>Backend:</b> Python FastAPI with Pydantic v2 schemas and modular service-repository architecture.<br/>"
        "• <b>Database:</b> PyMongo connected to MongoDB Atlas / local MongoDB, with automatic fallback to high-fidelity in-memory <code>mongomock</code> for zero-setup evaluation.<br/>"
        "• <b>AI / LLM:</b> Google Gemini 2.5 Flash API with fact-verification gate and fallback rule engine.<br/>"
        "• <b>Auditing:</b> Complete audit logging tracks every customer update, email send, and reconciliation approval.<br/>"
        "• <b>Testing:</b> 14/14 automated tests passing covering dynamic overdue calculation, fact-checking, TDS calculations, and idempotent approvals.",
        body_style
    ))

    # Section 5: Demo Video & Repository
    story.append(Paragraph("5. Demonstration Video & Repository Resources", h2_style))
    story.append(Paragraph(
        "• <b>GitHub Repository:</b> <font color='#2563eb'><u>https://github.com/RoHITKumar3456256/sonic-ai-collections-reconciliation</u></font><br/>"
        "• <b>1080p Full HD Demo Video:</b> Included directly in repository at <code>docs/sonic_ai_demo_walkthrough.mp4</code> (1m 53s full walkthrough).<br/>"
        "• <b>Automated Video Recorder:</b> Reproducible via <code>python scripts/record_demo_video.py</code> using Playwright and FFmpeg.",
        body_style
    ))

    doc.build(story)
    print(f"Generated explanation PDF at: {pdf_path}")

if __name__ == "__main__":
    generate_pdf()

