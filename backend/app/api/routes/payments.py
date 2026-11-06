from fastapi import APIRouter
from typing import List
from app.database import repository
from app.schemas.payment import PaymentResponse

router = APIRouter()

@router.get("/payments", response_model=List[PaymentResponse])
def get_payment_history():
    return repository.get_payments()
