"""
Database connection module for Supabase.
Handles initialization and management of Supabase client.
"""

import logging
from typing import Optional
from supabase import create_client, Client
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from app.settings import settings

logger = logging.getLogger(__name__)

# Supabase client singleton
_supabase_client: Optional[Client] = None

# SQLAlchemy setup (if using ORM)
Base = declarative_base()
_engine = None
_SessionLocal = None


def get_supabase_client() -> Client:
    """
    Get or create Supabase client instance.
    
    Returns:
        Client: Supabase client instance
    
    Raises:
        ValueError: If Supabase URL or key is not configured
    """
    global _supabase_client
    
    if _supabase_client is None:
        if not settings.supabase_url:
            raise ValueError("SUPABASE_URL not configured in environment variables")
        if not settings.supabase_key:
            raise ValueError("SUPABASE_KEY not configured in environment variables")
        
        _supabase_client = create_client(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_key
        )
        logger.info("Supabase client initialized successfully")
    
    return _supabase_client


def get_db_engine():
    """
    Get or create SQLAlchemy engine for direct PostgreSQL access.
    
    Returns:
        Engine: SQLAlchemy engine instance
    """
    global _engine
    
    if _engine is None and settings.database_url:
        # Convert Supabase URL to PostgreSQL connection string if needed
        postgres_url = settings.database_url
        if postgres_url.startswith("https://"):
            # Extract the project reference from the URL
            # Format: https://[project-ref].supabase.co
            import re
            match = re.match(r'https://([^.]+)\.supabase\.co', postgres_url)
            if match:
                project_ref = match.group(1)
                # You'll need to provide the actual database connection details
                # This is a placeholder - replace with your actual PostgreSQL connection string
                postgres_url = f"postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
        
        _engine = create_engine(postgres_url, pool_pre_ping=True)
        logger.info("SQLAlchemy engine initialized successfully")
    
    return _engine


def get_session_local():
    """
    Get SQLAlchemy SessionLocal factory.
    
    Returns:
        sessionmaker: Session factory
    """
    global _SessionLocal
    
    if _SessionLocal is None:
        engine = get_db_engine()
        if engine:
            _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    return _SessionLocal


def get_db() -> Session:
    """
    Dependency to get database session.
    Use this in FastAPI endpoints with Depends().
    
    Yields:
        Session: Database session
    """
    SessionLocal = get_session_local()
    if SessionLocal:
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    else:
        # Return None if no database is configured
        yield None


async def test_connection() -> bool:
    """
    Test Supabase connection.
    
    Returns:
        bool: True if connection is successful, False otherwise
    """
    try:
        client = get_supabase_client()
        # Try a simple query to test the connection
        response = client.table('_test_connection').select('*').limit(1).execute()
        logger.info("Supabase connection test successful")
        return True
    except Exception as e:
        logger.error(f"Supabase connection test failed: {e}")
        return False


# Database utility functions
class DatabaseService:
    """Service class for common database operations."""
    
    @staticmethod
    def insert(table_name: str, data: dict) -> dict:
        """
        Insert data into a Supabase table.
        
        Args:
            table_name: Name of the table
            data: Data to insert
            
        Returns:
            dict: Inserted record
        """
        client = get_supabase_client()
        response = client.table(table_name).insert(data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def select(table_name: str, filters: dict = None, limit: int = None) -> list:
        """
        Select data from a Supabase table.
        
        Args:
            table_name: Name of the table
            filters: Filter conditions as key-value pairs
            limit: Maximum number of records to return
            
        Returns:
            list: List of records
        """
        client = get_supabase_client()
        query = client.table(table_name).select("*")
        
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        if limit:
            query = query.limit(limit)
        
        response = query.execute()
        return response.data
    
    @staticmethod
    def update(table_name: str, id_field: str, id_value: any, data: dict) -> dict:
        """
        Update a record in a Supabase table.
        
        Args:
            table_name: Name of the table
            id_field: Name of the ID field
            id_value: Value of the ID to update
            data: Data to update
            
        Returns:
            dict: Updated record
        """
        client = get_supabase_client()
        response = client.table(table_name).update(data).eq(id_field, id_value).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def delete(table_name: str, id_field: str, id_value: any) -> bool:
        """
        Delete a record from a Supabase table.
        
        Args:
            table_name: Name of the table
            id_field: Name of the ID field
            id_value: Value of the ID to delete
            
        Returns:
            bool: True if deletion was successful
        """
        client = get_supabase_client()
        response = client.table(table_name).delete().eq(id_field, id_value).execute()
        return len(response.data) > 0 if response.data else False
    
    @staticmethod
    def upsert(table_name: str, data: dict, on_conflict: str = None) -> dict:
        """
        Insert or update data in a Supabase table.
        
        Args:
            table_name: Name of the table
            data: Data to upsert
            on_conflict: Column name for conflict resolution
            
        Returns:
            dict: Upserted record
        """
        client = get_supabase_client()
        query = client.table(table_name).upsert(data)
        if on_conflict:
            query = query.on_conflict(on_conflict)
        response = query.execute()
        return response.data[0] if response.data else None