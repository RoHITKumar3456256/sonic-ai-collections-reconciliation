from fastapi import APIRouter, HTTPException
from app.database import repository
from app.schemas.organization import OrganizationResponse, OrganizationUpdate

router = APIRouter()

@router.get("/organization", response_model=OrganizationResponse)
def get_organization_endpoint():
    org = repository.get_organization()
    if not org:
        raise HTTPException(status_code=404, detail="Organization profile not initialized. Run seed_database.py.")
    return org

@router.put("/organization", response_model=OrganizationResponse)
def update_organization_endpoint(payload: OrganizationUpdate):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update.")
    updated = repository.update_organization(update_data)
    repository.add_audit_log(
        action="organization_updated",
        entity_type="organization",
        entity_id=updated.get("id", "org_acmecorp_001"),
        actor="admin",
        details=update_data
    )
    return updated

