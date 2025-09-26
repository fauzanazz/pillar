"""
Database models for Supabase tables.
These SQLAlchemy models can be used for type hints and ORM operations.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Contract(Base):
    """Model for contracts table."""
    __tablename__ = "contracts"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    content = Column(Text)
    file_path = Column(String)
    user_id = Column(String, nullable=False)
    status = Column(String, default="draft")  # draft, review, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata = Column(JSON)
    
    # Relationships
    risk_analyses = relationship("RiskAnalysis", back_populates="contract")
    search_results = relationship("SearchResult", back_populates="contract")


class RiskAnalysis(Base):
    """Model for risk analysis results."""
    __tablename__ = "risk_analyses"
    
    id = Column(String, primary_key=True)
    contract_id = Column(String, ForeignKey("contracts.id"), nullable=False)
    analysis_type = Column(String, nullable=False)  # general, legal, financial, compliance
    risk_level = Column(String)  # low, medium, high, critical
    risk_score = Column(Float)
    findings = Column(JSON)  # Structured risk findings
    recommendations = Column(JSON)  # Structured recommendations
    created_at = Column(DateTime, default=datetime.utcnow)
    analyzed_by = Column(String)  # AI model or user who performed analysis
    
    # Relationships
    contract = relationship("Contract", back_populates="risk_analyses")


class SearchResult(Base):
    """Model for storing search results and cache."""
    __tablename__ = "search_results"
    
    id = Column(String, primary_key=True)
    contract_id = Column(String, ForeignKey("contracts.id"))
    query = Column(Text, nullable=False)
    results = Column(JSON)  # Structured search results
    relevance_score = Column(Float)
    search_type = Column(String)  # semantic, keyword, hybrid
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
    # Relationships
    contract = relationship("Contract", back_populates="search_results")


class Workflow(Base):
    """Model for contract workflow tracking."""
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True)
    contract_id = Column(String, ForeignKey("contracts.id"), nullable=False)
    workflow_type = Column(String, nullable=False)  # review, approval, negotiation
    status = Column(String, default="pending")  # pending, in_progress, completed, failed
    current_step = Column(Integer, default=0)
    total_steps = Column(Integer)
    steps_data = Column(JSON)  # Detailed step information
    assigned_to = Column(String)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    metadata = Column(JSON)


class DocumentTemplate(Base):
    """Model for document templates."""
    __tablename__ = "document_templates"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    category = Column(String)  # NDA, employment, service, etc.
    content = Column(Text, nullable=False)
    variables = Column(JSON)  # Template variables and placeholders
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String)
    metadata = Column(JSON)


class AuditLog(Base):
    """Model for audit logging."""
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True)
    entity_type = Column(String, nullable=False)  # contract, risk_analysis, etc.
    entity_id = Column(String, nullable=False)
    action = Column(String, nullable=False)  # create, update, delete, view
    user_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    changes = Column(JSON)  # Before/after values for updates
    ip_address = Column(String)
    user_agent = Column(String)
    metadata = Column(JSON)


class User(Base):
    """Model for users (if managing users in Supabase)."""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, nullable=False, unique=True)
    full_name = Column(String)
    role = Column(String, default="user")  # user, admin, reviewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    preferences = Column(JSON)  # User preferences and settings
    metadata = Column(JSON)


# Helper functions for model operations
class ModelHelpers:
    """Helper functions for working with database models."""
    
    @staticmethod
    def create_tables(engine):
        """Create all tables in the database."""
        Base.metadata.create_all(bind=engine)
    
    @staticmethod
    def drop_tables(engine):
        """Drop all tables from the database."""
        Base.metadata.drop_all(bind=engine)
    
    @staticmethod
    def to_dict(model_instance):
        """Convert a model instance to dictionary."""
        if model_instance is None:
            return None
        
        result = {}
        for column in model_instance.__table__.columns:
            value = getattr(model_instance, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result