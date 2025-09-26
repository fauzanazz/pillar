"""Workflow models for contract management system."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime
import uuid


class ContractStatus(str, Enum):
    """Contract status in the workflow."""
    DRAFT_INTERNAL = "draft_internal"           # Internal created, waiting for legal
    DRAFT_LEGAL_REVIEW = "draft_legal_review"   # Legal reviewing clauses
    DRAFT_LEGAL_REJECTED = "draft_legal_rejected"  # Legal rejected, back to internal
    DRAFT_MANAGEMENT = "draft_management"       # Sent to management for approval
    APPROVED = "approved"                       # Management approved
    REJECTED_TO_LEGAL = "rejected_to_legal"     # Management rejected, back to legal
    REJECTED_TO_INTERNAL = "rejected_to_internal"  # Management rejected, back to internal
    REJECTED_TO_BOTH = "rejected_to_both"       # Management rejected, back to both


class UserRole(str, Enum):
    """User roles in the system."""
    INTERNAL = "internal"
    LEGAL = "legal"
    MANAGEMENT = "management"


class ClauseStatus(str, Enum):
    """Clause review status."""
    PENDING = "pending"      # AI generated, waiting for legal review
    ACCEPTED = "accepted"    # Legal accepted
    REJECTED = "rejected"    # Legal rejected
    EDITED = "edited"       # Legal edited the AI generated clause
    MANUAL = "manual"       # Legal added manually


class ContractClause(BaseModel):
    """Clause in contract with legal review status."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    no: int = Field(..., description="Clause number")
    title: str = Field(..., description="Clause title")
    text: str = Field(..., description="Clause content")
    status: ClauseStatus = Field(default=ClauseStatus.PENDING)
    original_text: Optional[str] = Field(None, description="Original AI generated text if edited")
    added_by: UserRole = Field(default=UserRole.LEGAL)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    notes: Optional[str] = Field(None, description="Legal notes on this clause")


class ContractParty(BaseModel):
    """Contract party information."""
    role: str = Field(..., description="Party role (e.g., 'PIHAK PERTAMA', 'PIHAK KEDUA')")
    name: str = Field(..., description="Party name")
    rep: Optional[str] = Field(None, description="Representative name")
    address: str = Field(..., description="Party address")


class ContractTemplate(BaseModel):
    """Contract template filled by internal."""
    title: str = Field(..., description="Contract title")
    description: str = Field(..., description="Contract description/use case")
    parties: List[ContractParty] = Field(..., min_items=2, description="Contract parties")
    end_date: str = Field(..., description="Contract end date")
    jurisdiction: str = Field(default="Indonesia", description="Jurisdiction")
    language: str = Field(default="Indonesian", description="Language")
    value: Optional[float] = Field(None, description="Contract value")
    special_requirements: Optional[str] = Field(None, description="Special requirements")


class ContractDraft(BaseModel):
    """Complete contract draft in the workflow."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    template: ContractTemplate = Field(..., description="Contract template")
    clauses: List[ContractClause] = Field(default_factory=list, description="Contract clauses")
    status: ContractStatus = Field(default=ContractStatus.DRAFT_INTERNAL)
    
    # Workflow tracking
    created_by: UserRole = Field(..., description="Who created this draft")
    current_assignee: UserRole = Field(..., description="Who should work on this now")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # Workflow history
    workflow_history: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Management feedback
    management_notes: Optional[str] = Field(None, description="Management rejection notes")
    legal_notes: Optional[str] = Field(None, description="Legal notes")
    internal_notes: Optional[str] = Field(None, description="Internal notes")
    
    # File tracking
    json_file_path: Optional[str] = Field(None, description="Path to saved JSON file")
    pdf_file_path: Optional[str] = Field(None, description="Path to saved PDF file")


class WorkflowAction(BaseModel):
    """Action taken in the workflow."""
    action: str = Field(..., description="Action taken")
    by_role: UserRole = Field(..., description="Who took the action")
    timestamp: datetime = Field(default_factory=datetime.now)
    notes: Optional[str] = Field(None, description="Action notes")
    old_status: Optional[ContractStatus] = Field(None)
    new_status: Optional[ContractStatus] = Field(None)


# Request/Response models for API
class CreateContractRequest(BaseModel):
    """Request to create new contract."""
    template: ContractTemplate = Field(..., description="Contract template")


class GenerateClausesRequest(BaseModel):
    """Request to generate AI clauses."""
    contract_id: str = Field(..., description="Contract ID")


class ReviewClauseRequest(BaseModel):
    """Request to review a clause."""
    contract_id: str = Field(..., description="Contract ID")
    clause_id: str = Field(..., description="Clause ID")
    status: ClauseStatus = Field(..., description="Review decision")
    edited_text: Optional[str] = Field(None, description="Edited text if modified")
    notes: Optional[str] = Field(None, description="Review notes")


class AddClauseRequest(BaseModel):
    """Request to add manual clause."""
    contract_id: str = Field(..., description="Contract ID")
    no: int = Field(..., description="Clause number")
    title: str = Field(..., description="Clause title")  
    text: str = Field(..., description="Clause content")
    notes: Optional[str] = Field(None, description="Notes")


class SubmitDraftRequest(BaseModel):
    """Request to submit draft to next stage."""
    contract_id: str = Field(..., description="Contract ID")
    notes: Optional[str] = Field(None, description="Submission notes")


class ManagementDecisionRequest(BaseModel):
    """Management decision on draft."""
    contract_id: str = Field(..., description="Contract ID")
    decision: str = Field(..., description="approve, reject_to_legal, reject_to_internal, reject_to_both")
    notes: Optional[str] = Field(None, description="Management notes")


class ContractListResponse(BaseModel):
    """Response for contract list."""
    contracts: List[ContractDraft] = Field(..., description="List of contracts")
    total: int = Field(..., description="Total count")


class ContractResponse(BaseModel):
    """Response for single contract."""
    contract: ContractDraft = Field(..., description="Contract details")
    actions_available: List[str] = Field(..., description="Available actions for current user")