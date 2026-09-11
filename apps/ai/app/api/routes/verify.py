from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.verification.hallucination_guard import HallucinationGuard

router = APIRouter()
guard = HallucinationGuard()

class VerifyCitationRequest(BaseModel):
    response_text: str
    available_citations: List[dict]

class VerifyResponse(BaseModel):
    is_valid: bool
    verified_count: int
    unverified_count: int
    warnings: List[str]
    confidence: float

@router.post("/citations", response_model=VerifyResponse)
async def verify_citations(request: VerifyCitationRequest):
    """Verify that all citations in a response are valid."""
    result = await guard.verify_response(request.response_text, request.available_citations)
    return VerifyResponse(
        is_valid=result.is_valid,
        verified_count=len(result.verified_citations),
        unverified_count=len(result.unverified_citations),
        warnings=result.warnings,
        confidence=result.confidence,
    )

@router.get("/rules")
async def get_verification_rules():
    """Get the system prompt rules for hallucination prevention."""
    return {"rules": guard.get_system_prompt()}