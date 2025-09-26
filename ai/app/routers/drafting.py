import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse

from app.models.schemas import DraftRequest, DraftResponse, DRAFT_JSON_SCHEMA
from app.services.openai_client import openai_client
from app.services.rag import rag_service
from app.services.prompts import get_system_prompt, get_user_prompt_template
from app.deps import get_correlation_id, rate_limit

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Contract Drafting"])


@router.post(
    "/draft",
    response_model=DraftResponse,
    summary="Generate contract draft with AI",
    description="Generate a contract draft with clauses, risk assessment, and governance compliance"
)
async def create_contract_draft(
    request: DraftRequest,
    correlation_id: str = Depends(get_correlation_id),
    _: None = Depends(rate_limit)
) -> DraftResponse:
    """
    Generate a contract draft based on the provided requirements.
    
    This endpoint:
    1. Retrieves relevant governance templates using RAG
    2. Calls OpenAI with structured outputs to generate clauses
    3. Returns validated JSON with risk assessments
    
    Args:
        request: Contract drafting request with use case, parties, dates, etc.
        correlation_id: Auto-generated correlation ID for request tracing
        
    Returns:
        DraftResponse with summary and list of clauses with risk scores
        
    Raises:
        HTTPException: 422 for validation errors, 500 for processing errors
    """
    try:
        logger.info(
            "Starting contract draft generation",
            extra={
                "correlation_id": correlation_id,
                "use_case_length": len(request.use_case),
                "parties_count": len(request.parties),
                "jurisdiction": request.jurisdiction,
                "language": request.language
            }
        )
        
        # Step 1: Retrieve relevant governance chunks
        governance_chunks = rag_service.retrieve_governance_chunks(
            query=request.use_case,
            k=5,
            correlation_id=correlation_id
        )
        
        # Step 2: Prepare context for AI
        governance_context = "\n\n".join([
            f"TEMPLATE: {chunk.title} (Kategori: {chunk.category})\n"
            f"Versi: {chunk.gov_version}\n"
            f"Isi: {chunk.body}"
            for chunk in governance_chunks
        ])
        
        user_prompt = get_user_prompt_template().format(
            use_case=request.use_case,
            parties=", ".join(request.parties),
            end_date=request.end_date,
            jurisdiction=request.jurisdiction,
            language=request.language,
            governance_chunks=governance_context
        )
        
        # Step 3: Call OpenAI with structured outputs
        ai_response = await openai_client.responses_create(
            system=get_system_prompt(),
            user_json={"prompt": user_prompt},
            json_schema=DRAFT_JSON_SCHEMA,
            correlation_id=correlation_id
        )
        
        # Step 4: Validate and return response
        response = DraftResponse(**ai_response)
        
        logger.info(
            "Contract draft generated successfully",
            extra={
                "correlation_id": correlation_id,
                "clauses_generated": len(response.clauses),
                "has_summary": bool(response.summary)
            }
        )
        
        return response
        
    except ValueError as e:
        logger.error(
            "Validation error in contract draft generation",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(
            status_code=422,
            detail={
                "error": {
                    "type": "validation_error",
                    "message": "Invalid input or AI response format",
                    "detail": str(e)
                }
            }
        )
        
    except Exception as e:
        logger.error(
            "Unexpected error in contract draft generation",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "type": "processing_error", 
                    "message": "Failed to generate contract draft",
                    "detail": str(e)
                }
            }
        )