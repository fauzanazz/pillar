"""Workflow service for contract management."""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.models.workflow import (
    ContractDraft, ContractTemplate, ContractClause, ContractStatus, 
    UserRole, ClauseStatus, WorkflowAction
)
from app.services.storage import contract_storage
from app.services.openai_client import openai_client
from app.services.rag import rag_service
from app.services.prompts import get_system_prompt, get_user_prompt_template
from app.services.pdf_service import pdf_service
from app.models.schemas import DRAFT_JSON_SCHEMA

logger = logging.getLogger(__name__)


class WorkflowService:
    """Service for managing contract workflow."""
    
    def __init__(self):
        self.storage = contract_storage
    
    def create_contract(self, template: ContractTemplate, created_by: UserRole = UserRole.INTERNAL) -> ContractDraft:
        """Create new contract from template."""
        contract = ContractDraft(
            template=template,
            created_by=created_by,
            current_assignee=UserRole.LEGAL,  # Next step is legal review
            status=ContractStatus.DRAFT_INTERNAL
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
        self.storage.save_contract(contract)
        
        logger.info(f"Contract created: {contract.id} by {created_by.value}")
        return contract
    
    async def generate_clauses(self, contract_id: str, correlation_id: Optional[str] = None) -> ContractDraft:
        """Generate AI clauses for contract."""
        contract = self.storage.load_contract(contract_id)
        if not contract:
            raise ValueError(f"Contract {contract_id} not found")
        
        if contract.status != ContractStatus.DRAFT_INTERNAL:
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
        contract.status = ContractStatus.DRAFT_LEGAL_REVIEW
        contract.current_assignee = UserRole.LEGAL
        contract.updated_at = datetime.now()
        
        # Add workflow history
        contract.workflow_history.append({
            "action": "clauses_generated",
            "by_role": UserRole.INTERNAL.value,
            "timestamp": datetime.now().isoformat(),
            "notes": f"Generated {len(clauses)} clauses using AI",
            "old_status": ContractStatus.DRAFT_INTERNAL.value,
            "new_status": ContractStatus.DRAFT_LEGAL_REVIEW.value
        })
        
        # Regenerate PDF with clauses
        pdf_path = self._generate_contract_pdf(contract, correlation_id)
        if pdf_path:
            contract.pdf_file_path = pdf_path
        
        # Save updated contract
        self.storage.save_contract(contract)
        
        logger.info(f"Generated {len(clauses)} clauses for contract {contract_id}")
        return contract
    
    def review_clause(self, contract_id: str, clause_id: str, status: ClauseStatus, 
                     edited_text: Optional[str] = None, notes: Optional[str] = None,
                     reviewed_by: UserRole = UserRole.LEGAL) -> ContractDraft:
        """Review a clause (accept/reject/edit)."""
        contract = self.storage.load_contract(contract_id)
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
        self.storage.save_contract(contract)
        
        logger.info(f"Clause {clause_id} in contract {contract_id} marked as {status.value}")
        return contract
    
    def add_manual_clause(self, contract_id: str, no: int, title: str, text: str, 
                         notes: Optional[str] = None, added_by: UserRole = UserRole.LEGAL) -> ContractDraft:
        """Add manual clause by legal."""
        contract = self.storage.load_contract(contract_id)
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
        self.storage.save_contract(contract)
        
        logger.info(f"Manual clause added to contract {contract_id}: {title}")
        return contract
    
    def submit_to_management(self, contract_id: str, submitted_by: UserRole = UserRole.LEGAL,
                           notes: Optional[str] = None) -> ContractDraft:
        """Submit contract to management for approval."""
        contract = self.storage.load_contract(contract_id)
        if not contract:
            raise ValueError(f"Contract {contract_id} not found")
        
        if contract.status not in [ContractStatus.DRAFT_LEGAL_REVIEW, ContractStatus.REJECTED_TO_LEGAL]:
            raise ValueError(f"Cannot submit contract in status {contract.status}")
        
        # Check that all clauses are reviewed
        pending_clauses = [c for c in contract.clauses if c.status == ClauseStatus.PENDING]
        if pending_clauses:
            raise ValueError(f"Cannot submit: {len(pending_clauses)} clauses still pending review")
        
        # Update status
        old_status = contract.status
        contract.status = ContractStatus.DRAFT_MANAGEMENT
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
            "new_status": ContractStatus.DRAFT_MANAGEMENT.value
        })
        
        # Regenerate PDF with final reviewed clauses
        pdf_path = self._generate_contract_pdf(contract)
        if pdf_path:
            contract.pdf_file_path = pdf_path
        
        self.storage.save_contract(contract)
        
        logger.info(f"Contract {contract_id} submitted to management")
        return contract
    
    def management_decision(self, contract_id: str, decision: str, notes: Optional[str] = None,
                          decided_by: UserRole = UserRole.MANAGEMENT) -> ContractDraft:
        """Management decision on contract."""
        contract = self.storage.load_contract(contract_id)
        if not contract:
            raise ValueError(f"Contract {contract_id} not found")
        
        if contract.status != ContractStatus.DRAFT_MANAGEMENT:
            raise ValueError(f"Cannot make decision on contract in status {contract.status}")
        
        old_status = contract.status
        
        # Update status based on decision
        if decision == "approve":
            contract.status = ContractStatus.APPROVED
            contract.current_assignee = UserRole.MANAGEMENT  # Process complete
        elif decision == "reject_to_legal":
            contract.status = ContractStatus.REJECTED_TO_LEGAL
            contract.current_assignee = UserRole.LEGAL
        elif decision == "reject_to_internal":
            contract.status = ContractStatus.REJECTED_TO_INTERNAL
            contract.current_assignee = UserRole.INTERNAL
        elif decision == "reject_to_both":
            contract.status = ContractStatus.REJECTED_TO_BOTH
            contract.current_assignee = UserRole.INTERNAL  # Internal handles coordination
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
            pdf_path = self._generate_contract_pdf(contract)
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
            if contract.status in [ContractStatus.REJECTED_TO_INTERNAL, ContractStatus.REJECTED_TO_BOTH]:
                actions.extend(["edit_template"])
        
        elif role == UserRole.LEGAL:
            if contract.status == ContractStatus.DRAFT_INTERNAL:
                actions.extend(["generate_clauses"])
            elif contract.status == ContractStatus.DRAFT_LEGAL_REVIEW:
                actions.extend(["review_clauses", "add_clause", "submit_to_management"])
            elif contract.status in [ContractStatus.REJECTED_TO_LEGAL, ContractStatus.REJECTED_TO_BOTH]:
                actions.extend(["review_clauses", "add_clause", "edit_clauses", "regenerate_clauses", "submit_to_management"])
        
        elif role == UserRole.MANAGEMENT:
            if contract.status == ContractStatus.DRAFT_MANAGEMENT:
                actions.extend(["approve", "reject_to_legal", "reject_to_internal", "reject_to_both"])
        
        # Common actions
        actions.extend(["view_details", "view_history", "export_pdf"])
        
        return actions
    
    def _generate_contract_pdf(self, contract: ContractDraft, correlation_id: Optional[str] = None) -> str:
        """Generate PDF for contract and return file path."""
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
                watermark="DRAFT" if contract.status != ContractStatus.APPROVED else None
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
            
            # Save PDF file
            pdf_filename = f"contract_{contract.id}.pdf"
            pdf_path = contract_storage.base_path / "pdfs" / pdf_filename
            pdf_path.parent.mkdir(exist_ok=True)
            
            with open(pdf_path, "wb") as f:
                f.write(pdf_bytes)
                
            logger.info(f"PDF generated: {pdf_path}")
            return str(pdf_path)
            
        except Exception as e:
            logger.error(f"Failed to generate PDF for contract {contract.id}: {e}")
            return None


# Global workflow service
workflow_service = WorkflowService()