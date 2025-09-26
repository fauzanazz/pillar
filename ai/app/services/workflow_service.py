"""Workflow service for contract management."""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.models.workflow import (
    ContractDraft, ContractTemplate, ContractClause, ContractStatus, 
    UserRole, ClauseStatus, WorkflowAction
)
from app.services.db_adapter import contract_db_adapter
from app.services.openai_client import openai_client
from app.services.rag import rag_service
from app.services.prompts import get_system_prompt, get_user_prompt_template
from app.services.pdf_service import pdf_service
from app.models.schemas import DRAFT_JSON_SCHEMA

logger = logging.getLogger(__name__)


class WorkflowService:
    """Service for managing contract workflow."""
    
    def __init__(self):
        self.storage = contract_db_adapter
    
    async def create_contract(self, template: ContractTemplate, created_by: UserRole = UserRole.INTERNAL) -> ContractDraft:
        """Create new contract from template."""
        contract = ContractDraft(
            template=template,
            created_by=created_by,
            current_assignee=UserRole.LEGAL,  # Next step is legal review
            status=ContractStatus.DRAFT
        )
        
        # Add workflow history
        contract.workflow_history.append({
            "action": "contract_created",
            "by_role": created_by.value,
            "timestamp": datetime.now().isoformat(),
            "notes": f"Contract created: {template.title}"
        })
        
        # Generate initial PDF (template without clauses)
        pdf_path = self._generate_contract_pdf(contract)
        if pdf_path:
            contract.pdf_file_path = pdf_path
        
        # Save contract
        await self.storage.save_contract(contract)
        
        logger.info(f"Contract created: {contract.id} by {created_by.value}")
        return contract
    
    async def generate_clauses(self, contract_id: str, correlation_id: Optional[str] = None) -> ContractDraft:
        """Generate AI clauses for contract."""
        contract = await self.storage.load_contract(contract_id)
        if not contract:
            raise ValueError(f"Contract {contract_id} not found")
        
        if contract.status != ContractStatus.DRAFT:
            raise ValueError(f"Cannot generate clauses for contract in status {contract.status}")
        
        logger.info(f"Generating clauses for contract {contract_id}")
        
        # Prepare request for AI
        use_case = f"{contract.template.title}\n\nDescription: {contract.template.description}"
        if contract.template.special_requirements:
            use_case += f"\n\nSpecial Requirements: {contract.template.special_requirements}"
        
        parties = [party.name for party in contract.template.parties]
        
        # Get governance chunks
        governance_chunks = rag_service.retrieve_governance_chunks(
            query=use_case,
            k=5,
            correlation_id=correlation_id
        )
        
        # Prepare context for AI
        governance_context = "\n\n".join([
            f"TEMPLATE: {chunk.title} (Kategori: {chunk.category})\n"
            f"Versi: {chunk.gov_version}\n"
            f"Isi: {chunk.body}"
            for chunk in governance_chunks
        ])
        
        user_prompt = get_user_prompt_template().format(
            use_case=use_case,
            parties=", ".join(parties),
            end_date=contract.template.end_date,
            jurisdiction=contract.template.jurisdiction,
            language=contract.template.language,
            governance_chunks=governance_context
        )
        
        # Call OpenAI
        ai_response = await openai_client.responses_create(
            system=get_system_prompt(),
            user_json={"prompt": user_prompt},
            json_schema=DRAFT_JSON_SCHEMA,
            correlation_id=correlation_id
        )
        
        # Convert AI response to contract clauses
        clauses = []
        for i, clause_data in enumerate(ai_response.get('clauses', []), 1):
            clause = ContractClause(
                no=i,
                title=clause_data['title'],
                text=clause_data['text'],
                status=ClauseStatus.PENDING,
                added_by=UserRole.LEGAL,  # Will be reviewed by legal
                notes=f"AI Generated - Risk: {clause_data.get('risk', 0)}/100",
                risk_score=clause_data.get('risk', 0)
            )
            clauses.append(clause)
        
        # Update contract
        contract.clauses = clauses
        contract.status = ContractStatus.LEGAL_REVIEW
        contract.current_assignee = UserRole.LEGAL
        contract.updated_at = datetime.now()
        
        # Add workflow history
        contract.workflow_history.append({
            "action": "clauses_generated",
            "by_role": UserRole.INTERNAL.value,
            "timestamp": datetime.now().isoformat(),
            "notes": f"Generated {len(clauses)} clauses using AI",
            "old_status": ContractStatus.DRAFT.value,
            "new_status": ContractStatus.LEGAL_REVIEW.value
        })
        
        # Regenerate PDF with clauses
        pdf_path = self._generate_contract_pdf(contract, correlation_id)
        if pdf_path:
            contract.pdf_file_path = pdf_path
        
        # Save updated contract
        await self.storage.save_contract(contract)
        
        logger.info(f"Generated {len(clauses)} clauses for contract {contract_id}")
        return contract
    
    async def review_clause(self, contract_id: str, clause_id: str, status: ClauseStatus, 
                     edited_text: Optional[str] = None, notes: Optional[str] = None,
                     reviewed_by: UserRole = UserRole.LEGAL) -> ContractDraft:
        """Review a clause (accept/reject/edit)."""
        contract = await self.storage.load_contract(contract_id)
        if not contract:
            raise ValueError(f"Contract {contract_id} not found")
        
        # Find clause
        clause = None
        for c in contract.clauses:
            if c.id == clause_id:
                clause = c
                break
        
        if not clause:
            raise ValueError(f"Clause {clause_id} not found")
        
        # Update clause
        if edited_text and edited_text != clause.text:
            clause.original_text = clause.text
            clause.text = edited_text
            clause.status = ClauseStatus.EDITED
        else:
            clause.status = status
        
        if notes:
            clause.notes = notes
        
        clause.updated_at = datetime.now()
        
        # Add workflow history
        contract.workflow_history.append({
            "action": f"clause_{status.value}",
            "by_role": reviewed_by.value,
            "timestamp": datetime.now().isoformat(),
            "notes": f"Clause {clause.no}: {clause.title} - {status.value}" + (f" - {notes}" if notes else ""),
            "clause_id": clause_id
        })
        
        contract.updated_at = datetime.now()
        await self.storage.save_contract(contract)
        
        logger.info(f"Clause {clause_id} in contract {contract_id} marked as {status.value}")
        return contract
    
    async def add_manual_clause(self, contract_id: str, no: int, title: str, text: str, 
                         notes: Optional[str] = None, added_by: UserRole = UserRole.LEGAL) -> ContractDraft:
        """Add manual clause by legal."""
        contract = await self.storage.load_contract(contract_id)
        if not contract:
            raise ValueError(f"Contract {contract_id} not found")
        
        # Create new clause
        clause = ContractClause(
            no=no,
            title=title,
            text=text,
            status=ClauseStatus.MANUAL,
            added_by=added_by,
            notes=notes or "Manually added by legal"
        )
        
        # Insert clause in correct position
        contract.clauses.append(clause)
        # Sort by clause number
        contract.clauses.sort(key=lambda x: x.no)
        
        # Add workflow history
        contract.workflow_history.append({
            "action": "clause_added",
            "by_role": added_by.value,
            "timestamp": datetime.now().isoformat(),
            "notes": f"Manual clause added: {title}",
            "clause_id": clause.id
        })
        
        contract.updated_at = datetime.now()
        await self.storage.save_contract(contract)
        
        logger.info(f"Manual clause added to contract {contract_id}: {title}")
        return contract
    
    async def submit_to_management(self, contract_id: str, submitted_by: UserRole = UserRole.LEGAL,
                           notes: Optional[str] = None, presigned_url: Optional[str] = None) -> ContractDraft:
        """Submit contract to management for approval."""
        contract = await self.storage.load_contract(contract_id)
        if not contract:
            raise ValueError(f"Contract {contract_id} not found")
        
        if contract.status not in [ContractStatus.LEGAL_REVIEW, ContractStatus.REJECTED]:
            raise ValueError(f"Cannot submit contract in status {contract.status}")
        
        # Check that all clauses are reviewed
        pending_clauses = [c for c in contract.clauses if c.status == ClauseStatus.PENDING]
        if pending_clauses:
            raise ValueError(f"Cannot submit: {len(pending_clauses)} clauses still pending review")
        
        # Update status
        old_status = contract.status
        contract.status = ContractStatus.MANAGEMENT_REVIEW
        contract.current_assignee = UserRole.MANAGEMENT
        contract.legal_notes = notes
        contract.updated_at = datetime.now()
        
        # Add workflow history
        contract.workflow_history.append({
            "action": "submitted_to_management",
            "by_role": submitted_by.value,
            "timestamp": datetime.now().isoformat(),
            "notes": notes or "Draft submitted to management for approval",
            "old_status": old_status.value,
            "new_status": ContractStatus.MANAGEMENT_REVIEW.value
        })
        
        # Regenerate PDF with final reviewed clauses
        pdf_path = self._generate_contract_pdf(contract, presigned_url=presigned_url)
        if pdf_path:
            contract.pdf_file_path = pdf_path
        
        await self.storage.save_contract(contract)
        
        logger.info(f"Contract {contract_id} submitted to management")
        return contract
    
    def management_decision(self, contract_id: str, decision: str, notes: Optional[str] = None,
                          decided_by: UserRole = UserRole.MANAGEMENT, presigned_url: Optional[str] = None) -> ContractDraft:
        """Management decision on contract."""
        contract = self.storage.load_contract(contract_id)
        if not contract:
            raise ValueError(f"Contract {contract_id} not found")
        
        if contract.status != ContractStatus.MANAGEMENT_REVIEW:
            raise ValueError(f"Cannot make decision on contract in status {contract.status}")
        
        old_status = contract.status
        
        # Update status based on decision
        if decision == "approve":
            contract.status = ContractStatus.ACCEPTED
            contract.current_assignee = UserRole.MANAGEMENT  # Process complete
            
            # Trigger risk identification for approved contracts (background task)
            import threading
            try:
                def run_risk_identification():
                    import asyncio
                    try:
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        loop.run_until_complete(
                            self._trigger_risk_identification_async(contract, correlation_id=None)
                        )
                    except Exception as e:
                        logger.error(f"Background risk identification failed for {contract_id}: {e}")
                    finally:
                        loop.close()
                
                thread = threading.Thread(target=run_risk_identification, daemon=True)
                thread.start()
                logger.info(f"Risk identification task started in background for contract {contract_id}")
            except Exception as e:
                logger.warning(f"Failed to start background risk identification for contract {contract_id}: {e}")
        elif decision == "reject":
            contract.status = ContractStatus.REJECTED
            contract.current_assignee = UserRole.INTERNAL
        else:
            raise ValueError(f"Invalid decision: {decision}")
        
        contract.management_notes = notes
        contract.updated_at = datetime.now()
        
        # Add workflow history
        contract.workflow_history.append({
            "action": f"management_{decision}",
            "by_role": decided_by.value,
            "timestamp": datetime.now().isoformat(),
            "notes": notes or f"Management {decision}",
            "old_status": old_status.value,
            "new_status": contract.status.value
        })
        
        # Generate final PDF for approved contracts
        if decision == "approve":
            pdf_path = self._generate_contract_pdf(contract, presigned_url=presigned_url)
            if pdf_path:
                contract.pdf_file_path = pdf_path
        
        self.storage.save_contract(contract)
        
        logger.info(f"Management decision on contract {contract_id}: {decision}")
        return contract
    
    def get_contracts_for_role(self, role: UserRole) -> List[ContractDraft]:
        """Get contracts assigned to a role."""
        return self.storage.list_contracts(assignee=role)
    
    def get_contract_with_actions(self, contract_id: str, role: UserRole) -> Dict[str, Any]:
        """Get contract with available actions for role."""
        contract = self.storage.load_contract(contract_id)
        if not contract:
            raise ValueError(f"Contract {contract_id} not found")
        
        actions = self._get_available_actions(contract, role)
        
        return {
            "contract": contract,
            "actions_available": actions
        }
    
    def _get_available_actions(self, contract: ContractDraft, role: UserRole) -> List[str]:
        """Get available actions for a role on a contract."""
        actions = []
        
        if role == UserRole.INTERNAL:
            if contract.status in [ContractStatus.REJECTED]:
                actions.extend(["edit_template"])
        
        elif role == UserRole.LEGAL:
            if contract.status == ContractStatus.DRAFT:
                actions.extend(["generate_clauses"])
            elif contract.status == ContractStatus.LEGAL_REVIEW:
                actions.extend(["review_clauses", "add_clause", "submit_to_management"])
            elif contract.status in [ContractStatus.REJECTED]:
                actions.extend(["review_clauses", "add_clause", "edit_clauses", "regenerate_clauses", "submit_to_management"])
        
        elif role == UserRole.MANAGEMENT:
            if contract.status == ContractStatus.MANAGEMENT_REVIEW:
                actions.extend(["approve", "reject"])
        
        # Common actions
        actions.extend(["view_details", "view_history", "export_pdf"])
        
        return actions
    
    def _generate_contract_pdf(self, contract: ContractDraft, correlation_id: Optional[str] = None, presigned_url: Optional[str] = None) -> str:
        """Generate PDF for contract and return file path or URL.
        
        Args:
            contract: Contract draft to generate PDF for
            correlation_id: Request correlation ID
            presigned_url: Optional presigned URL to upload PDF to
            
        Returns:
            File path if saving locally, or URL if uploaded to presigned URL
        """
        try:
            from app.models.schemas import PdfBuildRequest, PdfHeader, PdfFooter, Party, PdfClause
            
            # Create PDF request
            pdf_request = PdfBuildRequest(
                header=PdfHeader(
                    title=contract.template.title,
                    number=contract.id[:8]
                ),
                parties=[
                    Party(
                        role=party.role,
                        name=party.name,
                        rep=party.rep,
                        address=party.address
                    )
                    for party in contract.template.parties
                ],
                clauses=[
                    PdfClause(
                        no=clause.no,
                        title=clause.title,
                        text=clause.text
                    )
                    for clause in contract.clauses
                ] if contract.clauses else [],
                footer=PdfFooter(
                    hash=contract.id[:16],
                    version="1.0"
                ),
                watermark="DRAFT" if contract.status != ContractStatus.ACCEPTED else None
            )
            
            # Generate PDF (need to run async method in sync context)
            import asyncio
            try:
                # Try to get current event loop
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # If loop is running, we can't use run_until_complete
                    # Create a task instead
                    import concurrent.futures
                    import threading
                    
                    def run_in_thread():
                        new_loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(new_loop)
                        try:
                            return new_loop.run_until_complete(
                                pdf_service.generate_contract_pdf(pdf_request, correlation_id)
                            )
                        finally:
                            new_loop.close()
                    
                    with concurrent.futures.ThreadPoolExecutor() as executor:
                        future = executor.submit(run_in_thread)
                        pdf_bytes = future.result()
                else:
                    # Loop exists but not running
                    pdf_bytes = loop.run_until_complete(
                        pdf_service.generate_contract_pdf(pdf_request, correlation_id)
                    )
            except RuntimeError:
                # No event loop
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    pdf_bytes = loop.run_until_complete(
                        pdf_service.generate_contract_pdf(pdf_request, correlation_id)
                    )
                finally:
                    loop.close()
            
            # Upload to presigned URL if provided, otherwise save locally
            if presigned_url:
                from app.services.upload_service import upload_service
                
                # Run async upload in sync context
                try:
                    # Try to get current event loop
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        # If loop is running, create a task in thread
                        import concurrent.futures
                        import threading
                        
                        def upload_in_thread():
                            new_loop = asyncio.new_event_loop()
                            asyncio.set_event_loop(new_loop)
                            try:
                                return new_loop.run_until_complete(
                                    upload_service.upload_pdf_to_presigned_url(
                                        pdf_bytes=pdf_bytes,
                                        presigned_url=presigned_url,
                                        correlation_id=correlation_id
                                    )
                                )
                            finally:
                                new_loop.close()
                        
                        with concurrent.futures.ThreadPoolExecutor() as executor:
                            future = executor.submit(upload_in_thread)
                            pdf_url = future.result()
                    else:
                        # Loop exists but not running
                        pdf_url = loop.run_until_complete(
                            upload_service.upload_pdf_to_presigned_url(
                                pdf_bytes=pdf_bytes,
                                presigned_url=presigned_url,
                                correlation_id=correlation_id
                            )
                        )
                except RuntimeError:
                    # No event loop
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        pdf_url = loop.run_until_complete(
                            upload_service.upload_pdf_to_presigned_url(
                                pdf_bytes=pdf_bytes,
                                presigned_url=presigned_url,
                                correlation_id=correlation_id
                            )
                        )
                    finally:
                        loop.close()
                
                logger.info(f"PDF uploaded to presigned URL: {pdf_url}")
                return pdf_url
            else:
                # Save locally as fallback
                from pathlib import Path
                pdf_filename = f"contract_{contract.id}.pdf"
                pdf_dir = Path("out") / "pdfs"
                pdf_dir.mkdir(parents=True, exist_ok=True)
                pdf_path = pdf_dir / pdf_filename
                
                with open(pdf_path, "wb") as f:
                    f.write(pdf_bytes)
                    
                logger.info(f"PDF saved locally: {pdf_path}")
                return str(pdf_path)
            
        except Exception as e:
            logger.error(f"Failed to generate PDF for contract {contract.id}: {e}")
            return None
    
    def _trigger_risk_identification(self, contract: ContractDraft, correlation_id: Optional[str] = None):
        try:
            from app.services.risk_identification import risk_identification_service
            
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
                "contract_id": contract.id,
                "title": contract.template.title,
                "description": contract.template.description,
                "end_date": contract.template.end_date,
                "jurisdiction": contract.template.jurisdiction,
                "language": contract.template.language,
                "status": contract.status.value,
                "parties": [{"name": p.name, "role": p.role} for p in contract.template.parties],
                "clause_count": len(contract.clauses)
            }
            
            risks = risk_identification_service.identify_contract_risks(
                contract_text=contract_text,
                contract_metadata=contract_metadata,
                correlation_id=correlation_id
            )
            
            if risks:
                total_score = sum(r["risk_score"] for r in risks)
                overall_risk_score = min(100, total_score // len(risks))
                
                critical_risks = len([r for r in risks if r["risk_level"] == "critical"])
                if critical_risks > 0:
                    overall_risk_score = min(100, overall_risk_score + (critical_risks * 10))
            else:
                overall_risk_score = 0
            
            contract.risk_score = overall_risk_score
            contract.workflow_history.append({
                "action": "risk_identification_completed",
                "by_role": "SYSTEM",
                "timestamp": datetime.now().isoformat(),
                "notes": f"Risk identification completed. Overall risk score: {overall_risk_score}. Total risks: {len(risks)}",
                "risk_data": {
                    "total_risks": len(risks),
                    "high_risks": len([r for r in risks if r["risk_level"] == "high"]),
                    "critical_risks": len([r for r in risks if r["risk_level"] == "critical"]),
                    "overall_score": overall_risk_score,
                    "risks": risks[:5]  
                }
            })
            
            self.storage.save_contract(contract)
            
            logger.info(
                f"Risk identification completed for contract {contract.id}",
                extra={
                    "correlation_id": correlation_id,
                    "contract_id": contract.id,
                    "total_risks": len(risks),
                    "overall_score": overall_risk_score
                }
            )
            
        except Exception as e:
            logger.error(
                f"Risk identification failed for contract {contract.id}: {e}",
                extra={"correlation_id": correlation_id, "contract_id": contract.id}
            )
            raise
    
    async def _trigger_risk_identification_async(self, contract: ContractDraft, correlation_id: Optional[str] = None):
        try:
            from app.services.risk_identification import risk_identification_service
            from pathlib import Path
            import json
            from datetime import datetime
            
            contract_text = f"Title: {contract.template.title}\n\n"
            if contract.template.description:
                contract_text += f"Description: {contract.template.description}\n\n"
            
            contract_text += "Parties:\n"
            for party in contract.template.parties:
                contract_text += f"- {party.role}: {party.name}\n"
            contract_text += "\n"
            
            contract_text += "Clauses:\n"
            for clause in contract.clauses:
                contract_text += f"Pasal {clause.no}. {clause.title}\n{clause.text}\n\n"
            
            contract_metadata = {
                "contract_id": contract.id,
                "title": contract.template.title,
                "description": contract.template.description,
                "end_date": contract.template.end_date,
                "jurisdiction": contract.template.jurisdiction,
                "language": contract.template.language,
                "status": contract.status.value,
                "parties": [{"name": p.name, "role": p.role} for p in contract.template.parties],
                "clause_count": len(contract.clauses),
                "clauses": contract.clauses  
            }
            
            risks = await risk_identification_service.identify_contract_risks(
                contract_text=contract_text,
                contract_metadata=contract_metadata,
                correlation_id=correlation_id
            )
            
            simplified_risks = []
            for risk in risks:
                clause_ref = self._find_clause_reference(risk, contract_metadata)
                
                simplified_risk = {
                    "description": risk["description"],
                    "clause_reference": clause_ref,
                    "recommendation": risk["recommendation"]
                }
                simplified_risks.append(simplified_risk)
            
            if risks:
                total_score = sum(r["risk_score"] for r in risks)
                overall_risk_score = min(100, total_score // len(risks))
                
                critical_risks = len([r for r in risks if r["risk_level"] == "critical"])
                if critical_risks > 0:
                    overall_risk_score = min(100, overall_risk_score + (critical_risks * 10))
            else:
                overall_risk_score = 0
            
            contract.risk_score = overall_risk_score
            
            risk_output = {
                "contract": {
                    "id": contract.id,
                    "title": contract.template.title,
                    "file": f"contract_{contract.id}.json"
                },
                "risks": simplified_risks
            }
            
            risks_dir = Path("out/risks")
            risks_dir.mkdir(exist_ok=True)
            
            risk_file = risks_dir / f"risks_{contract.id}.json"
            with open(risk_file, 'w', encoding='utf-8') as f:
                json.dump(risk_output, f, indent=2, ensure_ascii=False)
            
            contract.workflow_history.append({
                "action": "risk_identification_completed",
                "by_role": "SYSTEM",
                "timestamp": datetime.now().isoformat(),
                "notes": f"Risk identification completed. Overall risk score: {overall_risk_score}. Total risks: {len(risks)}. Risk file: {risk_file.name}",
                "risk_data": {
                    "total_risks": len(risks),
                    "high_risks": len([r for r in risks if r["risk_level"] == "high"]),
                    "critical_risks": len([r for r in risks if r["risk_level"] == "critical"]),
                    "overall_score": overall_risk_score,
                    "risk_file": str(risk_file)
                }
            })
            
            self.storage.save_contract(contract)
            
            logger.info(
                f"Risk identification completed for contract {contract.id}",
                extra={
                    "correlation_id": correlation_id,
                    "contract_id": contract.id,
                    "total_risks": len(risks),
                    "overall_score": overall_risk_score,
                    "risk_file": str(risk_file)
                }
            )
            
        except Exception as e:
            logger.error(
                f"Risk identification failed for contract {contract.id}: {e}",
                extra={"correlation_id": correlation_id, "contract_id": contract.id}
            )
            raise
    
    def _find_clause_reference(self, risk, contract_metadata):
        clause_ref = risk.get("clause_reference", "")
        if not clause_ref:
            return None
        
        clauses = contract_metadata.get("clauses", [])
        
        for clause in clauses:
            clause_text = clause.get("text", "")
            clause_title = clause.get("title", "")
            clause_no = clause.get("no", "")
            
            if clause_ref.lower() in clause_text.lower() or clause_ref.lower() in clause_title.lower():
                return f"Pasal {clause_no}. {clause_title}"
        
        if len(clause_ref) > 50:
            return clause_ref[:50] + "..."
        return clause_ref


# Global workflow service
workflow_service = WorkflowService()