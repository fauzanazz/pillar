import logging
from typing import Dict, Any, List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.services.risk_identification import risk_identification_service
from app.deps import get_correlation_id, rate_limit

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Risk Identification"])


class RiskIdentificationRequest(BaseModel):
    contract_text: str
    contract_metadata: Dict[str, Any]


class RiskIdentificationResponse(BaseModel):
    risks: List[Dict[str, Any]]
    total_risks: int
    high_risk_count: int
    critical_risk_count: int
    overall_risk_score: int


@router.post("/identify-risks", response_model=RiskIdentificationResponse)
async def identify_contract_risks(
    request: RiskIdentificationRequest,
    correlation_id: str = Depends(get_correlation_id),
    _: None = Depends(rate_limit)
) -> RiskIdentificationResponse:
    """
    Identify risks in a contract.
    
    This endpoint analyzes a contract and returns identified risks including:
    - Date/deadline risks (contracts expiring within 1 week)
    - Irrelevant clauses (outdated references)
    - Risky clauses (unfavorable terms)
    - Financial risks (high penalties, unlimited liability)
    - Compliance risks (missing required clauses)
    """
    try:
        logger.info(
            "Risk identification requested",
            extra={
                "correlation_id": correlation_id,
                "contract_text_length": len(request.contract_text),
                "metadata_keys": list(request.contract_metadata.keys())
            }
        )
        
        risks = await risk_identification_service.identify_contract_risks(
            contract_text=request.contract_text,
            contract_metadata=request.contract_metadata,
            correlation_id=correlation_id
        )
        
        total_risks = len(risks)
        high_risk_count = len([r for r in risks if r["risk_level"] == "high"])
        critical_risk_count = len([r for r in risks if r["risk_level"] == "critical"])
        
        if total_risks > 0:
            total_score = sum(r["risk_score"] for r in risks)
            overall_risk_score = min(100, total_score // total_risks)
            
            if critical_risk_count > 0:
                overall_risk_score = min(100, overall_risk_score + (critical_risk_count * 10))
        else:
            overall_risk_score = 0
        
        response = RiskIdentificationResponse(
            risks=risks,
            total_risks=total_risks,
            high_risk_count=high_risk_count,
            critical_risk_count=critical_risk_count,
            overall_risk_score=overall_risk_score
        )
        
        logger.info(
            "Risk identification completed",
            extra={
                "correlation_id": correlation_id,
                "total_risks": total_risks,
                "high_risks": high_risk_count,
                "critical_risks": critical_risk_count,
                "overall_score": overall_risk_score
            }
        )
        
        return response
        
    except Exception as e:
        logger.error(
            "Risk identification failed",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail=f"Risk identification failed: {str(e)}")


@router.post("/identify-risks/contract/{contract_id}")
async def identify_risks_for_contract(
    contract_id: str,
    correlation_id: str = Depends(get_correlation_id),
    _: None = Depends(rate_limit)
) -> RiskIdentificationResponse:
    try:
        logger.info(
            "Risk identification for contract requested",
            extra={
                "correlation_id": correlation_id,
                "contract_id": contract_id
            }
        )
        
        from app.services.db_adapter import contract_db_adapter
        contract = await contract_db_adapter.load_contract(contract_id)
        if not contract:
            raise HTTPException(status_code=404, detail=f"Contract {contract_id} not found")
        
        contract_text = f"Title: {contract.template.title}\n\n"
        if contract.template.description:
            contract_text += f"Description: {contract.template.description}\n\n"
        
        contract_text += "Parties:\n"
        for party in contract.template.parties:
            contract_text += f"- {party.role}: {party.name}\n"
        contract_text += "\n"
        
        contract_text += "Clauses:\n"
        for clause in contract.clauses:
            contract_text += f"{clause.no}. {clause.title}\n{clause.text}\n\n"
        
        contract_metadata = {
            "contract_id": contract_id,
            "title": contract.template.title,
            "description": contract.template.description,
            "end_date": contract.template.end_date,
            "jurisdiction": contract.template.jurisdiction,
            "language": contract.template.language,
            "status": contract.status.value,
            "parties": [{"name": p.name, "role": p.role} for p in contract.template.parties],
            "clause_count": len(contract.clauses)
        }
        
        risks = await risk_identification_service.identify_contract_risks(
            contract_text=contract_text,
            contract_metadata=contract_metadata,
            correlation_id=correlation_id
        )
        
        total_risks = len(risks)
        high_risk_count = len([r for r in risks if r["risk_level"] == "high"])
        critical_risk_count = len([r for r in risks if r["risk_level"] == "critical"])
        
        if total_risks > 0:
            total_score = sum(r["risk_score"] for r in risks)
            overall_risk_score = min(100, total_score // total_risks)
            
            if critical_risk_count > 0:
                overall_risk_score = min(100, overall_risk_score + (critical_risk_count * 10))
        else:
            overall_risk_score = 0
        
        # Store risk scan results directly in database
        risk_scan_data = {
            "contract": {
                "id": contract_id,
                "title": contract.template.title,
                "file": f"contract_{contract_id}.json"
            },
            "risks": risks,
            "scan_metadata": {
                "scanned_at": datetime.now().isoformat(),
                "total_risks": total_risks,
                "high_risk_count": high_risk_count,
                "critical_risk_count": critical_risk_count,
                "overall_risk_score": overall_risk_score
            }
        }
        
        # Update contract risk score and store risk scan data in ai_metadata
        contract.risk_score = overall_risk_score
        await contract_db_adapter.save_contract_with_risk_data(contract, risk_scan_data)
        
        # Create alerts for each risk
        from app.services.alert_service import alert_service
        created_alerts = await alert_service.create_alerts_from_risks(
            contract_id=contract_id,
            risks=risks,
            created_by="risk_scanner"
        )
        
        response = RiskIdentificationResponse(
            risks=risks,
            total_risks=total_risks,
            high_risk_count=high_risk_count,
            critical_risk_count=critical_risk_count,
            overall_risk_score=overall_risk_score
        )
        
        logger.info(
            "Risk identification for contract completed",
            extra={
                "correlation_id": correlation_id,
                "contract_id": contract_id,
                "total_risks": total_risks,
                "overall_score": overall_risk_score,
                "alerts_created": len(created_alerts)
            }
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Risk identification for contract failed",
            extra={
                "correlation_id": correlation_id,
                "contract_id": contract_id,
                "error": str(e)
            }
        )
        raise HTTPException(status_code=500, detail=f"Risk identification failed: {str(e)}")