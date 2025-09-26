"""Workflow API routes for contract management."""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import Response

from app.models.workflow import (
    CreateContractRequest, GenerateClausesRequest, ReviewClauseRequest,
    AddClauseRequest, SubmitDraftRequest, ManagementDecisionRequest,
    ContractListResponse, ContractResponse, UserRole, ContractStatus
)
from app.services.workflow_service import workflow_service
from app.services.pdf_service import pdf_service
from app.deps import get_correlation_id, rate_limit

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Contract Workflow"])


@router.post("/contracts", response_model=ContractResponse)
async def create_contract(
    request: CreateContractRequest,
    correlation_id: str = Depends(get_correlation_id),
    _: None = Depends(rate_limit)
) -> ContractResponse:
    """Create new contract from template."""
    try:
        logger.info(
            "Creating new contract",
            extra={
                "correlation_id": correlation_id,
                "title": request.template.title,
                "parties_count": len(request.template.parties)
            }
        )
        
        contract = workflow_service.create_contract(request.template)
        actions = workflow_service._get_available_actions(contract, UserRole.INTERNAL)
        
        return ContractResponse(
            contract=contract,
            actions_available=actions
        )
        
    except Exception as e:
        logger.error(
            "Failed to create contract",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contracts/{contract_id}/clauses/generate")
async def generate_clauses(
    contract_id: str,
    correlation_id: str = Depends(get_correlation_id),
    _: None = Depends(rate_limit)
) -> ContractResponse:
    """Generate AI clauses for contract."""
    try:
        logger.info(
            "Generating clauses",
            extra={"correlation_id": correlation_id, "contract_id": contract_id}
        )
        
        contract = await workflow_service.generate_clauses(contract_id, correlation_id)
        actions = workflow_service._get_available_actions(contract, UserRole.LEGAL)
        
        return ContractResponse(
            contract=contract,
            actions_available=actions
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(
            "Failed to generate clauses",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/contracts/{contract_id}/clauses/{clause_id}/review")
async def review_clause(
    contract_id: str,
    clause_id: str,
    request: ReviewClauseRequest,
    correlation_id: str = Depends(get_correlation_id)
) -> ContractResponse:
    """Review a clause (accept/reject/edit)."""
    try:
        contract = workflow_service.review_clause(
            contract_id, clause_id, request.status,
            request.edited_text, request.notes
        )
        actions = workflow_service._get_available_actions(contract, UserRole.LEGAL)
        
        return ContractResponse(
            contract=contract,
            actions_available=actions
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(
            "Failed to review clause",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contracts/{contract_id}/clauses")
async def add_clause(
    contract_id: str,
    request: AddClauseRequest,
    correlation_id: str = Depends(get_correlation_id)
) -> ContractResponse:
    """Add manual clause."""
    try:
        contract = workflow_service.add_manual_clause(
            contract_id, request.no, request.title, request.text, request.notes
        )
        actions = workflow_service._get_available_actions(contract, UserRole.LEGAL)
        
        return ContractResponse(
            contract=contract,
            actions_available=actions
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(
            "Failed to add clause",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contracts/{contract_id}/submit")
async def submit_to_management(
    contract_id: str,
    request: SubmitDraftRequest,
    correlation_id: str = Depends(get_correlation_id)
) -> ContractResponse:
    """Submit contract to management."""
    try:
        contract = workflow_service.submit_to_management(
            contract_id, notes=request.notes
        )
        actions = workflow_service._get_available_actions(contract, UserRole.MANAGEMENT)
        
        return ContractResponse(
            contract=contract,
            actions_available=actions
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(
            "Failed to submit contract",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contracts/{contract_id}/decision")
async def management_decision(
    contract_id: str,
    request: ManagementDecisionRequest,
    correlation_id: str = Depends(get_correlation_id)
) -> ContractResponse:
    """Management decision on contract."""
    try:
        contract = workflow_service.management_decision(
            contract_id, request.decision, request.notes
        )
        actions = workflow_service._get_available_actions(contract, UserRole.MANAGEMENT)
        
        return ContractResponse(
            contract=contract,
            actions_available=actions
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(
            "Failed to record decision",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/contracts", response_model=ContractListResponse)
async def list_contracts(
    role: Optional[UserRole] = Query(None, description="Filter by assigned role"),
    status: Optional[ContractStatus] = Query(None, description="Filter by status"),
    correlation_id: str = Depends(get_correlation_id)
) -> ContractListResponse:
    """List contracts with optional filtering."""
    try:
        if role:
            contracts = workflow_service.get_contracts_for_role(role)
        else:
            contracts = workflow_service.storage.list_contracts(status=status)
        
        return ContractListResponse(
            contracts=contracts,
            total=len(contracts)
        )
        
    except Exception as e:
        logger.error(
            "Failed to list contracts",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/contracts/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: str,
    role: UserRole = Query(..., description="User role for action calculation"),
    correlation_id: str = Depends(get_correlation_id)
) -> ContractResponse:
    """Get contract details with available actions."""
    try:
        contract_data = workflow_service.get_contract_with_actions(contract_id, role)
        
        return ContractResponse(
            contract=contract_data["contract"],
            actions_available=contract_data["actions_available"]
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(
            "Failed to get contract",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/contracts/{contract_id}/pdf")
async def export_contract_pdf(
    contract_id: str,
    correlation_id: str = Depends(get_correlation_id)
) -> Response:
    """Export contract to PDF."""
    try:
        contract = workflow_service.storage.load_contract(contract_id)
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Convert contract to PDF request format
        from app.models.schemas import PdfBuildRequest, PdfHeader, PdfFooter, PdfClause, Party
        
        pdf_request = PdfBuildRequest(
            header=PdfHeader(
                title=contract.template.title,
                number=f"DRAFT/{contract.id[:8]}"
            ),
            parties=[
                Party(
                    role=p.role,
                    name=p.name,
                    rep=p.rep,
                    address=p.address
                ) for p in contract.template.parties
            ],
            clauses=[
                PdfClause(
                    no=c.no,
                    title=c.title,
                    text=c.text
                ) for c in contract.clauses
            ],
            footer=PdfFooter(
                hash=f"CONTRACT-{contract.id}",
                version="1.0"
            ),
            watermark="DRAFT" if contract.status != ContractStatus.APPROVED else None
        )
        
        # Generate PDF
        pdf_bytes = await pdf_service.generate_contract_pdf(pdf_request, correlation_id)
        
        # Save PDF to storage
        pdf_path = workflow_service.storage.save_contract_pdf(
            contract_id, pdf_bytes, contract.status.value
        )
        
        # Return PDF
        filename = f"contract_{contract.id[:8]}_{contract.status.value}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
                "X-Correlation-ID": correlation_id
            }
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(
            "Failed to export PDF",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_stats(correlation_id: str = Depends(get_correlation_id)):
    """Get system statistics."""
    try:
        stats = workflow_service.storage.get_stats()
        return stats
        
    except Exception as e:
        logger.error(
            "Failed to get stats",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))