from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator


class Party(BaseModel):
    role: str = Field(..., description="Party role (e.g., 'PIHAK PERTAMA', 'PIHAK KEDUA')")
    name: str = Field(..., description="Party name")
    rep: Optional[str] = Field(None, description="Representative name")
    address: str = Field(..., description="Party address")


class DraftRequest(BaseModel):
    use_case: str = Field(..., description="Contract use case description")
    parties: List[str] = Field(..., min_items=2, description="List of party names")
    end_date: str = Field(..., description="Contract end date (ISO format)")
    jurisdiction: str = Field(default="ID", description="Jurisdiction code")
    language: str = Field(default="id", description="Language code")
    presignedUrl: Optional[str] = Field(None, description="Presigned URL for PDF upload", alias="presignedUrl")

    @validator('parties')
    def validate_parties(cls, v):
        if len(v) < 2:
            raise ValueError('At least 2 parties required')
        return v


class Clause(BaseModel):
    title: str = Field(..., description="Clause title")
    category: Optional[str] = Field(None, description="Clause category")
    text: str = Field(..., description="Clause content")
    risk: int = Field(..., ge=0, le=100, description="Risk score (0-100)")
    rationale: Optional[str] = Field(None, description="Risk rationale")
    refs: Optional[str] = Field(None, description="Reference to governance")
    suggested: Optional[bool] = Field(None, description="Whether this is a suggested clause")


class DraftResponse(BaseModel):
    summary: Optional[str] = Field(None, description="Contract summary")
    clauses: List[Clause] = Field(..., description="List of contract clauses")
    pdf_url: Optional[str] = Field(None, description="URL of the uploaded PDF file")


class PdfClause(BaseModel):
    no: int = Field(..., description="Clause number")
    title: str = Field(..., description="Clause title")
    text: str = Field(..., description="Clause content")


class PdfHeader(BaseModel):
    title: str = Field(..., description="Contract title")
    number: Optional[str] = Field(None, description="Contract number")


class PdfFooter(BaseModel):
    hash: Optional[str] = Field(None, description="Document hash")
    version: Optional[str] = Field(None, description="Document version")


class PdfBuildRequest(BaseModel):
    header: PdfHeader = Field(..., description="PDF header")
    parties: List[Party] = Field(..., min_items=2, description="Contract parties")
    clauses: List[PdfClause] = Field(..., description="Contract clauses")
    footer: PdfFooter = Field(..., description="PDF footer")
    watermark: Optional[str] = Field(None, description="Watermark text (e.g., 'DRAFT')")


class ErrorResponse(BaseModel):
    error: Dict[str, Any] = Field(..., description="Error details")


class HealthResponse(BaseModel):
    ok: bool = Field(default=True, description="Service health status")


DRAFT_JSON_SCHEMA = {
    "name": "contract_draft",
    "description": "Contract draft with clauses and analysis",
    "schema": {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "Brief contract summary"
            },
            "clauses": {
                "type": "array",
                "description": "List of contract clauses",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "Clause title"
                        },
                        "category": {
                            "type": "string",
                            "description": "Clause category"
                        },
                        "text": {
                            "type": "string",
                            "description": "Clause content in Indonesian"
                        },
                        "risk": {
                            "type": "integer",
                            "minimum": 0,
                            "maximum": 100,
                            "description": "Risk score from 0-100"
                        },
                        "rationale": {
                            "type": "string",
                            "description": "Risk assessment rationale"
                        },
                        "refs": {
                            "type": "string",
                            "description": "Reference to governance templates"
                        },
                        "suggested": {
                            "type": "boolean",
                            "description": "Whether this is a suggested clause"
                        }
                    },
                    "required": ["title", "text", "risk"],
                    "additionalProperties": False
                }
            }
        },
        "required": ["clauses"],
        "additionalProperties": False
    }
}