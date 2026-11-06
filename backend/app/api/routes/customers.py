from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.database import repository
from app.schemas.customer import CustomerResponse, CustomerUpdate

router = APIRouter()

@router.get("/customers", response_model=List[CustomerResponse])
def list_customers(search: Optional[str] = Query(None)):
    return repository.get_customers(search=search)

@router.get("/customers/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: str):
    cust = repository.get_customer_by_id(customer_id)
    if not cust:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found.")
    return cust

@router.put("/customers/{customer_id}", response_model=CustomerResponse)
def update_customer_endpoint(customer_id: str, payload: CustomerUpdate):
    existing = repository.get_customer_by_id(customer_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found.")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    updated = repository.update_customer(customer_id, update_data)
    repository.add_audit_log(
        action="customer_updated",
        entity_type="customer",
        entity_id=customer_id,
        actor="operator",
        details=update_data
    )
    return updated

