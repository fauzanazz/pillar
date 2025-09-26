"""File-based storage service for contract management."""

import json
import os
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from app.models.workflow import ContractDraft, ContractStatus, UserRole

logger = logging.getLogger(__name__)


class ContractStorage:
    """File-based storage for contracts."""
    
    def __init__(self, base_path: str = None):
        """Initialize storage with base path."""
        if base_path is None:
            base_path = Path(__file__).parent.parent.parent / "out"
        
        self.base_path = Path(base_path)
        self.contracts_path = self.base_path / "contracts"
        self.internal_path = self.base_path / "internal"
        
        # Create directories
        self.contracts_path.mkdir(parents=True, exist_ok=True)
        self.internal_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Contract storage initialized at {self.base_path}")
    
    def save_contract(self, contract: ContractDraft) -> str:
        """Save contract to file and return file path."""
        filename = f"contract_{contract.id}.json"
        file_path = self.contracts_path / filename
        
        # Update file paths in contract
        contract.json_file_path = str(file_path)
        contract.updated_at = datetime.now()
        
        # Save to file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(contract.model_dump(), f, indent=2, ensure_ascii=False, default=str)
        
        logger.info(f"Contract {contract.id} saved to {file_path}")
        return str(file_path)
    
    def load_contract(self, contract_id: str) -> Optional[ContractDraft]:
        """Load contract from file."""
        filename = f"contract_{contract_id}.json"
        file_path = self.contracts_path / filename
        
        if not file_path.exists():
            return None
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Convert datetime strings back to datetime objects
            if 'created_at' in data:
                data['created_at'] = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00'))
            if 'updated_at' in data:
                data['updated_at'] = datetime.fromisoformat(data['updated_at'].replace('Z', '+00:00'))
            
            # Convert clause datetimes
            for clause in data.get('clauses', []):
                if 'created_at' in clause:
                    clause['created_at'] = datetime.fromisoformat(clause['created_at'].replace('Z', '+00:00'))
                if 'updated_at' in clause:
                    clause['updated_at'] = datetime.fromisoformat(clause['updated_at'].replace('Z', '+00:00'))
            
            return ContractDraft(**data)
            
        except Exception as e:
            logger.error(f"Failed to load contract {contract_id}: {e}")
            return None
    
    def list_contracts(self, 
                      status: Optional[ContractStatus] = None,
                      assignee: Optional[UserRole] = None) -> List[ContractDraft]:
        """List contracts with optional filtering."""
        contracts = []
        
        for file_path in self.contracts_path.glob("contract_*.json"):
            contract = self.load_contract(file_path.stem.replace('contract_', ''))
            if contract is None:
                continue
            
            # Apply filters
            if status and contract.status != status:
                continue
            if assignee and contract.current_assignee != assignee:
                continue
            
            contracts.append(contract)
        
        # Sort by updated_at descending
        contracts.sort(key=lambda x: x.updated_at, reverse=True)
        return contracts
    
    def delete_contract(self, contract_id: str) -> bool:
        """Delete contract file."""
        filename = f"contract_{contract_id}.json"
        file_path = self.contracts_path / filename
        
        if file_path.exists():
            file_path.unlink()
            logger.info(f"Contract {contract_id} deleted")
            return True
        return False
    
    def save_contract_pdf(self, contract_id: str, pdf_bytes: bytes, stage: str = "current") -> str:
        """Save PDF file for contract."""
        # Create subdirectory for this contract
        contract_dir = self.internal_path / f"contract_{contract_id}"
        contract_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"contract_{contract_id}_{stage}_{timestamp}.pdf"
        file_path = contract_dir / filename
        
        with open(file_path, 'wb') as f:
            f.write(pdf_bytes)
        
        # Update contract with PDF path
        contract = self.load_contract(contract_id)
        if contract:
            contract.pdf_file_path = str(file_path)
            self.save_contract(contract)
        
        logger.info(f"PDF saved for contract {contract_id} at {file_path}")
        return str(file_path)
    
    def get_contract_files(self, contract_id: str) -> Dict[str, List[str]]:
        """Get all files associated with a contract."""
        contract_dir = self.internal_path / f"contract_{contract_id}"
        files = {
            "pdfs": [],
            "jsons": []
        }
        
        if contract_dir.exists():
            for file_path in contract_dir.iterdir():
                if file_path.suffix == '.pdf':
                    files["pdfs"].append(str(file_path))
                elif file_path.suffix == '.json':
                    files["jsons"].append(str(file_path))
        
        return files
    
    def get_stats(self) -> Dict[str, int]:
        """Get storage statistics."""
        stats = {
            "total_contracts": 0,
            "by_status": {},
            "by_assignee": {}
        }
        
        for file_path in self.contracts_path.glob("contract_*.json"):
            contract = self.load_contract(file_path.stem.replace('contract_', ''))
            if contract is None:
                continue
            
            stats["total_contracts"] += 1
            
            status_key = contract.status.value
            stats["by_status"][status_key] = stats["by_status"].get(status_key, 0) + 1
            
            assignee_key = contract.current_assignee.value
            stats["by_assignee"][assignee_key] = stats["by_assignee"].get(assignee_key, 0) + 1
        
        return stats


# Global storage instance
contract_storage = ContractStorage()