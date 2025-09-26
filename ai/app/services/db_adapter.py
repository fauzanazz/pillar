"""
Database adapter to work with the actual contracts table schema.
This adapter converts between the application's models and the actual database schema.
"""

import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid

from app.models.workflow import ContractDraft, ContractTemplate, ContractParty, ContractClause, ContractStatus, UserRole, ClauseStatus
from app.database import get_supabase_client

logger = logging.getLogger(__name__)


class ContractDBAdapter:
    """Adapter for the contracts database table."""
    
    def __init__(self):
        self.client = get_supabase_client()
    
    async def load_contract(self, contract_id: str) -> Optional[ContractDraft]:
        """Load contract from database by ID."""
        try:
            # Convert string ID to integer if needed
            try:
                numeric_id = int(contract_id)
            except ValueError:
                # ID is not numeric, might be a UUID or other format
                numeric_id = contract_id
            
            response = self.client.table('contracts').select('*').eq('id', numeric_id).execute()
            
            if not response.data:
                return None
            
            data = response.data[0]
            return self._db_to_contract(data)
            
        except Exception as e:
            logger.error(f"Failed to load contract {contract_id}: {e}")
            return None
    
    async def save_contract(self, contract: ContractDraft) -> None:
        """Save or update contract in database."""
        try:
            # Convert contract to database format
            db_data = self._contract_to_db(contract)
            
            # Check if contract exists
            try:
                numeric_id = int(contract.id)
                existing = self.client.table('contracts').select('id').eq('id', numeric_id).execute()
                
                if existing.data:
                    # Update existing contract - remove id from update data
                    update_data = {k: v for k, v in db_data.items() if k != 'id'}
                    response = self.client.table('contracts').update(update_data).eq('id', numeric_id).execute()
                    logger.info(f"Updated contract {contract.id} in database")
                else:
                    # Insert new contract  
                    response = self.client.table('contracts').insert(db_data).execute()
                    logger.info(f"Inserted new contract {contract.id} in database")
                    
            except ValueError:
                # Non-numeric ID, treat as new
                response = self.client.table('contracts').insert(db_data).execute()
                logger.info(f"Inserted new contract {contract.id} in database")
                
        except Exception as e:
            logger.error(f"Failed to save contract {contract.id}: {e}")
            raise
    
    async def save_contract_with_risk_data(self, contract: ContractDraft, risk_scan_data: Dict[str, Any]) -> None:
        """Save contract and include risk scan data in ai_metadata."""
        try:
            # Convert contract to database format
            db_data = self._contract_to_db(contract)
            
            # Add risk scan data to ai_metadata
            ai_metadata = db_data.get('ai_metadata', {})
            ai_metadata['risk_scan'] = risk_scan_data
            db_data['ai_metadata'] = ai_metadata
            
            # Check if contract exists and save
            try:
                numeric_id = int(contract.id)
                existing = self.client.table('contracts').select('id').eq('id', numeric_id).execute()
                
                if existing.data:
                    # Update existing contract - remove id from update data
                    update_data = {k: v for k, v in db_data.items() if k != 'id'}
                    response = self.client.table('contracts').update(update_data).eq('id', numeric_id).execute()
                    logger.info(f"Updated contract {contract.id} with risk scan data")
                else:
                    # Insert new contract
                    response = self.client.table('contracts').insert(db_data).execute()
                    logger.info(f"Inserted new contract {contract.id} with risk scan data")
                    
            except ValueError:
                # Non-numeric ID, treat as new
                response = self.client.table('contracts').insert(db_data).execute()
                logger.info(f"Inserted new contract {contract.id} with risk scan data")
                
        except Exception as e:
            logger.error(f"Failed to save contract {contract.id} with risk data: {e}")
            raise
    
    def _db_to_contract(self, data: Dict[str, Any]) -> ContractDraft:
        """Convert database record to ContractDraft."""
        # Parse AI draft data if available
        ai_data = data.get('ai_draft_data', {}) or {}
        ai_metadata = data.get('ai_metadata', {}) or {}
        
        # Extract parties from AI data or create defaults
        parties = []
        if ai_data and 'parties' in ai_data:
            for p in ai_data['parties']:
                parties.append(ContractParty(
                    role=p.get('role', 'PIHAK PERTAMA'),
                    name=p.get('name', 'Unknown'),
                    rep=p.get('rep'),
                    address=p.get('address', '')
                ))
        
        # Ensure at least 2 parties
        if len(parties) < 2:
            parties = [
                ContractParty(
                    role="PIHAK PERTAMA",
                    name=data.get('created_by', 'Party 1'),
                    rep="Representative",
                    address="Address"
                ),
                ContractParty(
                    role="PIHAK KEDUA",
                    name="Party 2",
                    rep="Representative",
                    address="Address"
                )
            ]
        
        # Create template
        template = ContractTemplate(
            title=data.get('title', ''),
            description=data.get('description', ''),
            parties=parties,
            end_date=data.get('end_date', '2025-12-31'),
            jurisdiction=ai_data.get('jurisdiction', 'Indonesia'),
            language=ai_data.get('language', 'Indonesian'),
            value=ai_data.get('value'),
            special_requirements=ai_data.get('special_requirements')
        )
        
        # Extract clauses from AI data
        clauses = []
        if ai_data and 'clauses' in ai_data:
            for i, c in enumerate(ai_data['clauses'], 1):
                clauses.append(ContractClause(
                    id=c.get('id', str(uuid.uuid4())),
                    no=c.get('no', i),
                    title=c.get('title', ''),
                    text=c.get('text', ''),
                    status=ClauseStatus.PENDING,
                    added_by=UserRole.LEGAL,
                    risk_score=c.get('risk', 0)
                ))
        
        # Map old status values to new workflow statuses
        status_mapping = {
            'Draft': 'draft_internal',
            'Legal Review': 'draft_legal_review',
            'Management Review': 'draft_management',
            'Accepted': 'approved',
            'Rejected': 'rejected_to_internal',
            'Canceled': 'rejected_to_internal'
        }
        
        status = data.get('status', 'draft_internal')
        mapped_status = status_mapping.get(status, status)
        if mapped_status not in ['draft_internal', 'draft_legal_review', 'draft_legal_rejected', 
                                 'draft_management', 'approved', 'rejected_to_legal', 
                                 'rejected_to_internal', 'rejected_to_both']:
            mapped_status = 'draft_internal'
        
        # Create contract
        return ContractDraft(
            id=str(data.get('id')),
            template=template,
            clauses=clauses,
            status=ContractStatus(mapped_status),
            created_by=UserRole.INTERNAL,
            current_assignee=UserRole.LEGAL,
            created_at=datetime.fromisoformat(data['created_at'].replace('Z', '+00:00')) if data.get('created_at') else datetime.now(),
            updated_at=datetime.fromisoformat(data['updated_at'].replace('Z', '+00:00')) if data.get('updated_at') else datetime.now(),
            pdf_file_path=data.get('url_contract'),
            risk_score=data.get('risk_score'),
            management_notes=data.get('reason'),
            workflow_history=ai_metadata.get('workflow_history', [])
        )
    
    def _contract_to_db(self, contract: ContractDraft) -> Dict[str, Any]:
        """Convert ContractDraft to database format."""
        # Prepare AI draft data
        ai_draft_data = {
            'summary': contract.template.description,
            'parties': [
                {
                    'role': p.role,
                    'name': p.name,
                    'rep': p.rep,
                    'address': p.address
                } for p in contract.template.parties
            ],
            'clauses': [
                {
                    'id': c.id,
                    'no': c.no,
                    'title': c.title,
                    'text': c.text,
                    'risk': c.risk_score or 0,
                    'category': 'General',
                    'rationale': c.notes or ''
                } for c in contract.clauses
            ],
            'jurisdiction': contract.template.jurisdiction,
            'language': contract.template.language,
            'value': contract.template.value,
            'special_requirements': contract.template.special_requirements
        }
        
        # Prepare AI metadata (including risk data)
        ai_metadata = {
            'workflow_history': contract.workflow_history,
            'correlation_id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            'risk_scan': getattr(contract, 'risk_scan_data', None)
        }
        
        # Reverse status mapping
        status_mapping = {
            'draft_internal': 'Draft',
            'draft_legal_review': 'Legal Review',
            'draft_legal_rejected': 'Draft',
            'draft_management': 'Management Review',
            'approved': 'Accepted',
            'rejected_to_legal': 'Legal Review',
            'rejected_to_internal': 'Rejected',
            'rejected_to_both': 'Rejected'
        }
        
        status_value = contract.status.value if hasattr(contract.status, 'value') else str(contract.status)
        db_status = status_mapping.get(status_value, 'Draft')
        
        # Convert ID to integer if possible
        try:
            db_id = int(contract.id)
        except (ValueError, TypeError):
            # Generate a new integer ID if the current ID is not numeric
            # This is a workaround - in production you'd want auto-increment
            import random
            db_id = random.randint(1000, 999999)
        
        return {
            'id': db_id,
            'title': contract.template.title,
            'description': contract.template.description,
            'end_date': contract.template.end_date,
            'status': db_status,
            'risk_score': contract.risk_score or 0,
            'reason': contract.management_notes,
            'created_by': contract.created_by.value if hasattr(contract.created_by, 'value') else str(contract.created_by),
            'updated_by': contract.current_assignee.value if hasattr(contract.current_assignee, 'value') else str(contract.current_assignee),
            'url_contract': contract.pdf_file_path,
            'ai_draft_data': ai_draft_data,
            'ai_metadata': ai_metadata,
            'draft_summary': contract.template.description,
            'created_at': contract.created_at.isoformat() if contract.created_at else datetime.now().isoformat(),
            'updated_at': contract.updated_at.isoformat() if contract.updated_at else datetime.now().isoformat()
        }


# Global adapter instance
contract_db_adapter = ContractDBAdapter()