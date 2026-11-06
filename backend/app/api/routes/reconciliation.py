from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import List, Optional
from app.database import repository
from app.services.csv_service import parse_bank_csv_file
from app.reconciliation.matcher import (
    generate_reconciliation_batch,
    apply_match_approval,
    apply_match_rejection,
    apply_manual_selection
)
from app.schemas.reconciliation import (
    ReconciliationSuggestionResponse,
    ApproveMatchRequest,
    RejectMatchRequest,
    ManualSelectMatchRequest
)

router = APIRouter()

@router.post("/reconciliation/upload")
async def upload_bank_statement(file: UploadFile = File(...)):
    parsed_txns, summary = await parse_bank_csv_file(file)
    
    # Store parsed bank transactions with deduplication
    saved_count = repository.add_bank_transactions(parsed_txns)
    
    # Generate deterministic suggestions for credit transactions
    suggestions = generate_reconciliation_batch(parsed_txns)

    repository.add_audit_log(
        action="bank_statement_uploaded",
        entity_type="bank_statement",
        entity_id=summary.get("filename", "statement.csv"),
        actor="operator",
        details={
            **summary,
            "new_transactions_imported": saved_count,
            "suggestions_generated": len(suggestions)
        }
    )

    return {
        "summary": summary,
        "new_transactions_imported": saved_count,
        "suggestions_generated": len(suggestions)
    }

@router.get("/reconciliation", response_model=List[ReconciliationSuggestionResponse])
def get_reconciliation_suggestions_endpoint(status: Optional[str] = Query(None)):
    return repository.get_reconciliation_suggestions(status=status)

@router.post("/reconciliation/{suggestion_id}/approve")
def approve_suggestion_endpoint(suggestion_id: str, payload: ApproveMatchRequest):
    try:
        payment = apply_match_approval(
            suggestion_id=suggestion_id,
            action_type=payload.action_type,
            tds_amount=payload.tds_amount,
            notes=payload.notes
        )
        return {"success": True, "payment": payment}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/reconciliation/{suggestion_id}/reject")
def reject_suggestion_endpoint(suggestion_id: str, payload: RejectMatchRequest):
    try:
        updated = apply_match_rejection(
            suggestion_id=suggestion_id,
            reason=payload.reason or "Rejected by human operator"
        )
        return {"success": True, "suggestion": updated}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/reconciliation/{suggestion_id}/select")
def manual_select_endpoint(suggestion_id: str, payload: ManualSelectMatchRequest):
    try:
        payment = apply_manual_selection(
            suggestion_id=suggestion_id,
            selected_invoice_id=payload.invoice_id,
            action_type=payload.action_type,
            tds_amount=payload.tds_amount,
            notes=payload.notes
        )
        return {"success": True, "payment": payment}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

