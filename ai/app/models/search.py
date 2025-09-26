from typing import List, Optional, Dict, Any, Union
from datetime import datetime, date
from enum import Enum
from pydantic import BaseModel, Field
from app.models.workflow import ContractDraft, ContractStatus


class SearchIntent(str, Enum):
    CONTRACT_BY_PARTY = "contract_by_party"
    CONTRACT_BY_STATUS = "contract_by_status" 
    CONTRACT_EXPIRING = "contract_expiring"
    CLAUSE_BY_CONTENT = "clause_by_content"
    CLAUSE_BY_VALUE = "clause_by_value"
    CONTRACT_BY_VALUE = "contract_by_value"
    DATE_RANGE = "date_range"
    SEMANTIC_SEARCH = "semantic_search"
    GENERAL_QUERY = "general_query"


class SearchFilters(BaseModel):
    party_names: Optional[List[str]] = Field(None, description="Company/party names to search")
    statuses: Optional[List[str]] = Field(None, description="Contract statuses")
    start_date: Optional[date] = Field(None, description="Start date for range")
    end_date: Optional[date] = Field(None, description="End date for range")
    days_ahead: Optional[int] = Field(None, description="Days from now (for expiring contracts)")
    min_value: Optional[float] = Field(None, description="Minimum contract/clause value")
    max_value: Optional[float] = Field(None, description="Maximum contract/clause value")
    currency: Optional[str] = Field("Rupiah", description="Currency type")
    clause_keywords: Optional[List[str]] = Field(None, description="Keywords in clauses")
    clause_types: Optional[List[str]] = Field(None, description="Clause types (penalty, payment, etc)")
    jurisdictions: Optional[List[str]] = Field(None, description="Jurisdictions")
    semantic_query: Optional[str] = Field(None, description="Natural language query")


class SearchQuery(BaseModel):
    original_query: str = Field(..., description="User's original query")
    intent: SearchIntent = Field(..., description="Detected search intent")
    filters: SearchFilters = Field(default_factory=SearchFilters, description="Extracted filters")
    confidence: float = Field(..., description="AI confidence (0.0-1.0)")
    explanation: Optional[str] = Field(None, description="How AI understood the query")



class SearchMatch(BaseModel):
    contract: ContractDraft = Field(..., description="Matching contract")
    score: float = Field(..., description="Relevance score (0.0-1.0)")
    match_reasons: List[str] = Field(default_factory=list, description="Why this contract matches")
    highlights: Dict[str, List[str]] = Field(default_factory=dict, description="Highlighted text matches")

class SearchResponse(BaseModel):
    query: SearchQuery = Field(..., description="Processed query")
    matches: List[SearchMatch] = Field(default_factory=list, description="Search results")
    total_found: int = Field(..., description="Total matches found")
    processing_time_ms: int = Field(..., description="Processing time")
    suggestions: Optional[List[str]] = Field(None, description="Query suggestions")


SEARCH_QUERY_SCHEMA = {
    "name": "search_query_understanding",
    "description": "Understand natural language search query for contracts",
    "schema": {
        "type": "object",
        "properties": {
            "intent": {
                "type": "string",
                "enum": [intent.value for intent in SearchIntent],
                "description": "Primary search intent"
            },
            "confidence": {
                "type": "number",
                "minimum": 0.0,
                "maximum": 1.0,
                "description": "Confidence in understanding (0.0-1.0)"
            },
            "explanation": {
                "type": "string", 
                "description": "Brief explanation of how the query was understood"
            },
            "filters": {
                "type": "object",
                "properties": {
                    "party_names": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Company or party names mentioned"
                    },
                    "statuses": {
                        "type": "array", 
                        "items": {"type": "string"},
                        "description": "Contract statuses (draft, approved, etc)"
                    },
                    "start_date": {
                        "type": "string",
                        "format": "date",
                        "description": "Start date in YYYY-MM-DD format"
                    },
                    "end_date": {
                        "type": "string", 
                        "format": "date",
                        "description": "End date in YYYY-MM-DD format"
                    },
                    "days_ahead": {
                        "type": "integer",
                        "description": "Number of days from today"
                    },
                    "min_value": {
                        "type": "number",
                        "description": "Minimum value in Rupiah"
                    },
                    "max_value": {
                        "type": "number", 
                        "description": "Maximum value in Rupiah"
                    },
                    "clause_keywords": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Keywords to find in contract clauses"
                    },
                    "clause_types": {
                        "type": "array",
                        "items": {"type": "string"}, 
                        "description": "Types of clauses (penalty, payment, termination, etc)"
                    },
                    "jurisdictions": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Legal jurisdictions"
                    },
                    "semantic_query": {
                        "type": "string",
                        "description": "Semantic search query if intent is general"
                    }
                }
            }
        },
        "required": ["intent", "confidence", "explanation", "filters"]
    }
}