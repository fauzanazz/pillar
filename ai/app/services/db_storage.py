"""
Supabase database storage implementation for contract management.
This module handles all database operations for contracts using Supabase.
"""

import json
import logging
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database import get_supabase_client
from app.models.workflow import ContractDraft, UserRole, ContractStatus, ContractTemplate, ContractParty, ContractClause, ClauseStatus

logger = logging.getLogger(__name__)


class DBStorage:
    """Supabase database storage for contracts."""
    
    def __init__(self):
        """Initialize Supabase storage."""
        try:
            self.client = get_supabase_client()
            logger.info("Supabase storage initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase storage: {e}")
            raise
    
    async def save_contract(self, contract: ContractDraft) -> None:
        """Save contract to Supabase database.
        
        Args:
            contract: ContractDraft object to save
        """
        try:
            # Prepare data for database
            contract_data = self._contract_to_db_format(contract)
            
            # Check if contract exists
            existing = self.client.table('contracts').select('id').eq('id', contract.id).execute()
            
            if existing.data:
                # Update existing contract
                response = self.client.table('contracts').update(contract_data).eq('id', contract.id).execute()
                logger.info(f"Contract {contract.id} updated in database")
            else:
                # Insert new contract
                response = self.client.table('contracts').insert(contract_data).execute()
                logger.info(f"Contract {contract.id} saved to database")
                
        except Exception as e:
            logger.error(f"Failed to save contract {contract.id}: {e}")
            raise
    
    async def load_contract(self, contract_id: str) -> Optional[ContractDraft]:
        """Load contract from Supabase database.
        
        Args:
            contract_id: ID of the contract to load
            
        Returns:
            ContractDraft object if found, None otherwise
        """
        try:
            response = self.client.table('contracts').select('*').eq('id', contract_id).execute()
            
            if response.data:
                return self._db_to_contract_format(response.data[0])
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to load contract {contract_id}: {e}")
            return None
    
    async def list_contracts(self, assignee: Optional[UserRole] = None, limit: int = None) -> List[ContractDraft]:
        """List contracts from database with optional filtering.
        
        Args:
            assignee: Filter by assignee role
            limit: Maximum number of contracts to return
            
        Returns:
            List of ContractDraft objects
        """
        try:
            query = self.client.table('contracts').select('*')
            
            # Apply assignee filter if specified
            if assignee:
                # Store assignee in metadata JSON
                query = query.ilike('metadata->>current_assignee', f'%{assignee.value}%')
            
            # Order by created_at descending
            query = query.order('created_at', desc=True)
            
            # Apply limit if specified
            if limit:
                query = query.limit(limit)
            
            response = query.execute()
            
            contracts = []
            for data in response.data:
                contract = self._db_to_contract_format(data)
                if contract:
                    contracts.append(contract)
            
            return contracts
            
        except Exception as e:
            logger.error(f"Failed to list contracts: {e}")
            return []
    
    async def search_contracts(self, query: str, filters: Dict[str, Any] = None) -> List[ContractDraft]:
        """Search contracts in database with text query and filters.
        
        Args:
            query: Text search query
            filters: Dictionary of filter criteria
            
        Returns:
            List of matching ContractDraft objects
        """
        try:
            db_query = self.client.table('contracts').select('*')
            query_lower = query.lower() if query else ""
            
            # Apply status filter
            if filters and 'status' in filters and filters['status']:
                db_query = db_query.eq('status', filters['status'])
            
            # Apply date range filters
            if filters:
                if 'start_date' in filters and filters['start_date']:
                    db_query = db_query.gte('created_at', filters['start_date'].isoformat())
                
                if 'end_date' in filters and filters['end_date']:
                    db_query = db_query.lte('created_at', filters['end_date'].isoformat())
            
            # Order by created_at descending
            db_query = db_query.order('created_at', desc=True)
            
            # Execute query
            response = db_query.execute()
            
            # Filter results based on text search and other criteria
            results = []
            for data in response.data:
                contract = self._db_to_contract_format(data)
                if not contract:
                    continue
                
                # Check text match in contract fields
                match = self._check_text_match(contract, query_lower)
                
                # Check party names filter
                if match and filters and 'party_names' in filters and filters['party_names']:
                    match = self._check_party_match(contract, filters['party_names'])
                
                if match:
                    results.append(contract)
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to search contracts: {e}")
            return []
    
    def _contract_to_db_format(self, contract: ContractDraft) -> Dict[str, Any]:
        """Convert ContractDraft to database format.
        
        Args:
            contract: ContractDraft object
            
        Returns:
            Dictionary formatted for database
        """
        # Prepare metadata with all contract data
        metadata = {
            'template': {
                'title': contract.template.title,
                'description': contract.template.description,
                'parties': [{
                    'role': p.role,
                    'name': p.name,
                    'rep': p.rep,
                    'address': p.address
                } for p in contract.template.parties],
                'end_date': contract.template.end_date,
                'value': contract.template.value,
                'jurisdiction': contract.template.jurisdiction,
                'language': contract.template.language,
                'special_requirements': contract.template.special_requirements
            },
            'clauses': [{
                'id': c.id,
                'no': c.no,
                'title': c.title,
                'text': c.text,
                'status': c.status.value if hasattr(c.status, 'value') else c.status,
                'original_text': c.original_text,
                'added_by': c.added_by.value if hasattr(c.added_by, 'value') else str(c.added_by),
                'created_at': c.created_at.isoformat() if c.created_at else None,
                'updated_at': c.updated_at.isoformat() if c.updated_at else None,
                'notes': c.notes,
                'risk_score': c.risk_score
            } for c in contract.clauses],
            'current_assignee': contract.current_assignee.value if hasattr(contract.current_assignee, 'value') else str(contract.current_assignee),
            'created_by': contract.created_by.value if hasattr(contract.created_by, 'value') else str(contract.created_by),
            'json_file_path': contract.json_file_path,
            'pdf_file_path': contract.pdf_file_path,
            'workflow_history': contract.workflow_history,
            'management_notes': contract.management_notes,
            'legal_notes': contract.legal_notes,
            'internal_notes': contract.internal_notes,
            'risk_score': contract.risk_score
        }
        
        return {
            'id': contract.id,
            'title': contract.template.title,
            'content': json.dumps(metadata),  # Store full contract data as JSON string in content field
            'status': contract.status.value if hasattr(contract.status, 'value') else contract.status,
            'user_id': str(uuid.uuid4()),  # Generate a UUID for now, should come from auth
            'created_at': contract.created_at.isoformat() if contract.created_at else datetime.now().isoformat(),
            'updated_at': contract.updated_at.isoformat() if contract.updated_at else datetime.now().isoformat(),
            'metadata': metadata  # Store as JSONB for efficient querying
        }
    
    def _db_to_contract_format(self, data: Dict[str, Any]) -> Optional[ContractDraft]:
        """Convert database record to ContractDraft.
        
        Args:
            data: Database record dictionary
            
        Returns:
            ContractDraft object or None if conversion fails
        """
        try:
            # Get metadata from JSONB field or parse from content
            metadata = data.get('metadata', {})
            if not metadata and data.get('content'):
                try:
                    metadata = json.loads(data['content'])
                except json.JSONDecodeError:
                    metadata = {}
            
            # Reconstruct template
            template_data = metadata.get('template', {})
            
            # Handle parties - ensure we have at least 2 parties or create default ones
            parties_data = template_data.get('parties', [])
            parties = []
            for p in parties_data:
                try:
                    # Map 'type' field to 'role' if present
                    if 'type' in p and 'role' not in p:
                        p['role'] = p.pop('type')
                    parties.append(ContractParty(**p))
                except:
                    # Skip invalid party data
                    pass
            
            # If we don't have at least 2 parties, create default ones
            if len(parties) < 2:
                # Create default parties to satisfy validation
                parties = [
                    ContractParty(
                        role="PIHAK PERTAMA",
                        name="Party 1",
                        rep="Representative 1",
                        address="Address 1"
                    ),
                    ContractParty(
                        role="PIHAK KEDUA",
                        name="Party 2",
                        rep="Representative 2",
                        address="Address 2"
                    )
                ]
            
            # Handle end_date - provide default if None
            end_date = template_data.get('end_date')
            if end_date is None:
                end_date = "2025-12-31"  # Default end date
            
            template = ContractTemplate(
                title=template_data.get('title', data.get('title', '')),
                description=template_data.get('description', ''),
                parties=parties,
                end_date=end_date,
                jurisdiction=template_data.get('jurisdiction', 'Indonesia'),
                language=template_data.get('language', 'Indonesian'),
                value=template_data.get('value'),
                special_requirements=template_data.get('special_requirements')
            )
            
            # Reconstruct clauses
            clauses = []
            for clause_data in metadata.get('clauses', []):
                # Parse datetime strings
                created_at = None
                updated_at = None
                if clause_data.get('created_at'):
                    try:
                        created_at = datetime.fromisoformat(clause_data['created_at'].replace('Z', '+00:00'))
                    except:
                        created_at = datetime.now()
                if clause_data.get('updated_at'):
                    try:
                        updated_at = datetime.fromisoformat(clause_data['updated_at'].replace('Z', '+00:00'))
                    except:
                        updated_at = datetime.now()
                
                # Map clause status with validation
                clause_status = clause_data.get('status', 'pending')
                valid_clause_statuses = ['pending', 'accepted', 'rejected', 'edited', 'manual']
                if clause_status not in valid_clause_statuses:
                    clause_status = 'pending'
                
                clause = ContractClause(
                    id=clause_data.get('id', str(uuid.uuid4())),
                    no=clause_data.get('no', len(clauses) + 1),
                    title=clause_data.get('title', ''),
                    text=clause_data.get('text', ''),
                    status=ClauseStatus(clause_status),
                    original_text=clause_data.get('original_text'),
                    added_by=UserRole(clause_data.get('added_by', 'legal') if clause_data.get('added_by') in ['internal', 'legal', 'management'] else 'legal'),
                    created_at=created_at or datetime.now(),
                    updated_at=updated_at or datetime.now(),
                    notes=clause_data.get('notes'),
                    risk_score=clause_data.get('risk_score')
                )
                clauses.append(clause)
            
            # Parse datetime strings from database
            created_at = datetime.now()
            updated_at = datetime.now()
            if data.get('created_at'):
                try:
                    created_at = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00'))
                except:
                    pass
            if data.get('updated_at'):
                try:
                    updated_at = datetime.fromisoformat(data['updated_at'].replace('Z', '+00:00'))
                except:
                    pass
            
            # Get status directly - the database now uses the simplified enum values
            raw_status = data.get('status', 'Draft')
            
            # Ensure status is valid
            valid_statuses = ['Draft', 'Legal Review', 'Management Review', 'Accepted', 'Rejected', 'Canceled']
            if raw_status not in valid_statuses:
                mapped_status = ContractStatus.DRAFT
            else:
                mapped_status = ContractStatus(raw_status)
            
            # Create ContractDraft
            created_by_value = metadata.get('created_by', 'internal')
            if created_by_value not in ['internal', 'legal', 'management']:
                created_by_value = 'internal'
            
            current_assignee_value = metadata.get('current_assignee', 'legal')
            if current_assignee_value not in ['internal', 'legal', 'management']:
                current_assignee_value = 'legal'
            
            contract = ContractDraft(
                id=str(data.get('id', uuid.uuid4())),
                template=template,
                clauses=clauses,
                status=mapped_status,
                current_assignee=UserRole(current_assignee_value),
                created_by=UserRole(created_by_value),
                created_at=created_at,
                updated_at=updated_at,
                json_file_path=metadata.get('json_file_path'),
                pdf_file_path=metadata.get('pdf_file_path'),
                workflow_history=metadata.get('workflow_history', []),
                management_notes=metadata.get('management_notes'),
                legal_notes=metadata.get('legal_notes'),
                internal_notes=metadata.get('internal_notes'),
                risk_score=metadata.get('risk_score')
            )
            
            return contract
            
        except Exception as e:
            logger.error(f"Failed to convert database record to ContractDraft: {e}")
            return None
    
    def _check_text_match(self, contract: ContractDraft, query_lower: str) -> bool:
        """Check if contract matches text query.
        
        Args:
            contract: ContractDraft to check
            query_lower: Lowercase search query
            
        Returns:
            True if contract matches query
        """
        if not query_lower:
            return True
        
        # Search in title and description
        if (query_lower in contract.template.title.lower() or 
            query_lower in contract.template.description.lower()):
            return True
        
        # Search in party names and representatives
        for party in contract.template.parties:
            if (query_lower in party.name.lower() or 
                query_lower in party.rep.lower()):
                return True
        
        # Search in clauses
        for clause in contract.clauses:
            if (query_lower in clause.title.lower() or 
                query_lower in clause.text.lower()):
                return True
        
        return False
    
    def _check_party_match(self, contract: ContractDraft, party_names: List[str]) -> bool:
        """Check if contract matches party name filter.
        
        Args:
            contract: ContractDraft to check
            party_names: List of party names to match
            
        Returns:
            True if contract matches any party name
        """
        for search_party in party_names:
            search_party_lower = search_party.lower()
            for contract_party in contract.template.parties:
                if (search_party_lower in contract_party.name.lower() or
                    search_party_lower in contract_party.rep.lower()):
                    return True
        return False


# Global storage instance
db_contract_storage = DBStorage()
