import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import re

logger = logging.getLogger(__name__)


@dataclass
class RiskIdentification:
    risk_type: str
    risk_level: str  # "low", "medium", "high", "critical"
    risk_score: int  # 0-100
    description: str
    clause_reference: Optional[str] = None
    recommendation: Optional[str] = None
    deadline: Optional[str] = None


class RiskIdentificationService:
    def __init__(self):
        self.risky_patterns = self._load_risky_patterns()
        self.irrelevant_patterns = self._load_irrelevant_patterns()
    
    async def identify_contract_risks(
        self, 
        contract_text: str, 
        contract_metadata: Dict[str, Any],
        correlation_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        logger.info(
            "Starting risk identification",
            extra={
                "correlation_id": correlation_id,
                "contract_length": len(contract_text),
                "metadata_keys": list(contract_metadata.keys())
            }
        )
        
        risks = []
        
        # 1. Date/Deadline Risk Detection
        date_risks = self._detect_date_risks(contract_metadata, contract_text)
        risks.extend(date_risks)
        
        # 2. Irrelevant Clause Detection
        irrelevant_risks = self._detect_irrelevant_clauses(contract_text)
        risks.extend(irrelevant_risks)
        
        # 3. General Risky Clause Detection
        risky_clause_risks = self._detect_risky_clauses(contract_text)
        risks.extend(risky_clause_risks)
        
        # 4. Financial Risk Detection
        financial_risks = self._detect_financial_risks(contract_text)
        risks.extend(financial_risks)
        
        # 5. Legal Compliance Risk Detection
        compliance_risks = self._detect_compliance_risks(contract_text)
        risks.extend(compliance_risks)
        
        # Convert to JSON format
        result = [risk.to_dict() for risk in risks]
        
        logger.info(
            "Risk identification completed",
            extra={
                "correlation_id": correlation_id,
                "total_risks": len(result),
                "high_risks": len([r for r in result if r["risk_level"] == "high"]),
                "critical_risks": len([r for r in result if r["risk_level"] == "critical"])
            }
        )
        
        return result
    
    def _detect_date_risks(self, metadata: Dict[str, Any], contract_text: str) -> List[RiskIdentification]:
        risks = []
        
        end_date_str = metadata.get("end_date")
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                now = datetime.now()
                
                one_week_from_now = now + timedelta(days=7)
                
                if end_date <= one_week_from_now:
                    days_until_expiry = (end_date - now).days
                    
                    if days_until_expiry <= 0:
                        risk_level = "critical"
                        description = "Contract has already expired"
                    elif days_until_expiry <= 3:
                        risk_level = "critical"
                        description = f"Contract expires in {days_until_expiry} days"
                    else:
                        risk_level = "high"
                        description = f"Contract expires in {days_until_expiry} days (less than 1 week)"
                    
                    risks.append(RiskIdentification(
                        risk_type="deadline_expiry",
                        risk_level=risk_level,
                        risk_score=90 if risk_level == "critical" else 75,
                        description=description,
                        deadline=end_date_str,
                        recommendation="Urgent action required to renew or extend contract"
                    ))
                    
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to parse end_date {end_date_str}: {e}")
        
        date_patterns = [
            r"dalam waktu (\d+) hari",
            r"maksimal (\d+) hari",
            r"paling lambat (\d+) hari",
            r"deadline (\d+) hari"
        ]
        
        for pattern in date_patterns:
            matches = re.finditer(pattern, contract_text, re.IGNORECASE)
            for match in matches:
                days = int(match.group(1))
                if days <= 7:
                    risks.append(RiskIdentification(
                        risk_type="short_deadline",
                        risk_level="medium" if days > 3 else "high",
                        risk_score=60 if days > 3 else 80,
                        description=f"Short deadline found: {days} days - '{match.group(0)}'",
                        clause_reference=match.group(0),
                        recommendation="Monitor this deadline closely"
                    ))
        
        return risks
    
    def _detect_irrelevant_clauses(self, contract_text: str) -> List[RiskIdentification]:
        risks = []
        
        for pattern_info in self.irrelevant_patterns:
            pattern = pattern_info["pattern"]
            matches = re.finditer(pattern, contract_text, re.IGNORECASE)
            
            for match in matches:
                risks.append(RiskIdentification(
                    risk_type="irrelevant_clause",
                    risk_level=pattern_info["risk_level"],
                    risk_score=pattern_info["risk_score"],
                    description=f"Potentially irrelevant clause: {pattern_info['description']}",
                    clause_reference=match.group(0)[:100] + "..." if len(match.group(0)) > 100 else match.group(0),
                    recommendation=pattern_info["recommendation"]
                ))
        
        return risks
    
    def _detect_risky_clauses(self, contract_text: str) -> List[RiskIdentification]:
        risks = []
        
        for pattern_info in self.risky_patterns:
            pattern = pattern_info["pattern"]
            matches = re.finditer(pattern, contract_text, re.IGNORECASE)
            
            for match in matches:
                risks.append(RiskIdentification(
                    risk_type=pattern_info["type"],
                    risk_level=pattern_info["risk_level"],
                    risk_score=pattern_info["risk_score"],
                    description=pattern_info["description"],
                    clause_reference=match.group(0)[:100] + "..." if len(match.group(0)) > 100 else match.group(0),
                    recommendation=pattern_info["recommendation"]
                ))
        
        return risks
    
    def _detect_financial_risks(self, contract_text: str) -> List[RiskIdentification]:
        risks = []
        
        penalty_patterns = [
            r"denda (\d+)%",
            r"penalti (\d+)%",
            r"sanksi (\d+)%"
        ]
        
        for pattern in penalty_patterns:
            matches = re.finditer(pattern, contract_text, re.IGNORECASE)
            for match in matches:
                percentage = int(match.group(1))
                if percentage > 10:
                    risks.append(RiskIdentification(
                        risk_type="high_penalty",
                        risk_level="high" if percentage > 20 else "medium",
                        risk_score=85 if percentage > 20 else 65,
                        description=f"High penalty clause: {percentage}% penalty",
                        clause_reference=match.group(0),
                        recommendation="Review penalty terms for reasonableness"
                    ))
        
        unlimited_liability_patterns = [
            r"tanggung jawab tidak terbatas",
            r"unlimited liability",
            r"tanggung jawab penuh",
            r"ganti rugi tidak terbatas"
        ]
        
        for pattern in unlimited_liability_patterns:
            matches = re.finditer(pattern, contract_text, re.IGNORECASE)
            for match in matches:
                risks.append(RiskIdentification(
                    risk_type="unlimited_liability",
                    risk_level="critical",
                    risk_score=95,
                    description="Unlimited liability clause detected",
                    clause_reference=match.group(0),
                    recommendation="Consider limiting liability to specific amounts or percentages"
                ))
        
        return risks
    
    def _detect_compliance_risks(self, contract_text: str) -> List[RiskIdentification]:
        risks = []
        
        if not re.search(r"penyelesaian sengketa|dispute resolution|arbitrase|mediasi", contract_text, re.IGNORECASE):
            risks.append(RiskIdentification(
                risk_type="missing_dispute_resolution",
                risk_level="medium",
                risk_score=60,
                description="No dispute resolution mechanism specified",
                recommendation="Add dispute resolution clauses (mediation, arbitration, court jurisdiction)"
            ))
        
        if not re.search(r"force majeure|keadaan kahar|keadaan memaksa", contract_text, re.IGNORECASE):
            risks.append(RiskIdentification(
                risk_type="missing_force_majeure",
                risk_level="medium",
                risk_score=55,
                description="No force majeure clause found",
                recommendation="Consider adding force majeure provisions"
            ))
        
        if re.search(r"data pribadi|personal data|data protection", contract_text, re.IGNORECASE):
            if not re.search(r"UU.*27.*2022|law.*27.*2022|data protection law", contract_text, re.IGNORECASE):
                risks.append(RiskIdentification(
                    risk_type="data_protection_compliance",
                    risk_level="high",
                    risk_score=80,
                    description="Personal data processing mentioned but no reference to Indonesian Data Protection Law (UU No. 27/2022)",
                    recommendation="Ensure compliance with UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi"
                ))
        
        return risks
    
    def _load_risky_patterns(self) -> List[Dict[str, Any]]:
        return [
            {
                "pattern": r"dapat diubah sepihak|may be changed unilaterally|dapat dimodifikasi tanpa persetujuan",
                "type": "unilateral_modification",
                "risk_level": "high",
                "risk_score": 85,
                "description": "Unilateral modification clause detected",
                "recommendation": "Require mutual consent for contract modifications"
            },
            {
                "pattern": r"tidak dapat dibatalkan|irrevocable|tidak dapat ditarik kembali",
                "type": "irrevocable_terms",
                "risk_level": "medium",
                "risk_score": 70,
                "description": "Irrevocable terms clause",
                "recommendation": "Review necessity of irrevocable terms"
            },
            {
                "pattern": r"berlaku selamanya|perpetual|tidak ada batas waktu",
                "type": "perpetual_terms",
                "risk_level": "high",
                "risk_score": 80,
                "description": "Perpetual or indefinite terms",
                "recommendation": "Set specific termination conditions and time limits"
            },
            {
                "pattern": r"tanpa pemberitahuan|without notice|tanpa notifikasi",
                "type": "no_notice_termination",
                "risk_level": "medium",
                "risk_score": 65,
                "description": "Termination without notice clause",
                "recommendation": "Require reasonable notice period for termination"
            },
            {
                "pattern": r"eksklusif|exclusive|hanya dengan|solely with",
                "type": "exclusivity_clause",
                "risk_level": "medium",
                "risk_score": 60,
                "description": "Exclusivity clause detected",
                "recommendation": "Review exclusivity terms and scope"
            }
        ]
    
    def _load_irrelevant_patterns(self) -> List[Dict[str, Any]]:
        return [
            {
                "pattern": r"undang-undang.*199\d|law.*199\d|peraturan.*199\d",
                "risk_level": "medium",
                "risk_score": 60,
                "description": "References to potentially outdated 1990s legislation",
                "recommendation": "Verify if referenced legislation is still current"
            },
            {
                "pattern": r"fax|facsimile|telegram",
                "risk_level": "low",
                "risk_score": 30,
                "description": "References to outdated communication methods",
                "recommendation": "Update communication methods to modern alternatives"
            },
            {
                "pattern": r"windows 95|windows 98|internet explorer|netscape",
                "risk_level": "low",
                "risk_score": 25,
                "description": "References to obsolete technology",
                "recommendation": "Update technology references to current standards"
            },
            {
                "pattern": r"Y2K|year 2000|millennium bug",
                "risk_level": "low",
                "risk_score": 20,
                "description": "References to Y2K or millennium bug concerns",
                "recommendation": "Remove outdated Y2K references"
            }
        ]


def _risk_to_dict(self) -> Dict[str, Any]:
    return {
        "risk_type": self.risk_type,
        "risk_level": self.risk_level,
        "risk_score": self.risk_score,
        "description": self.description,
        "clause_reference": self.clause_reference,
        "recommendation": self.recommendation,
        "deadline": self.deadline
    }

RiskIdentification.to_dict = _risk_to_dict
risk_identification_service = RiskIdentificationService()