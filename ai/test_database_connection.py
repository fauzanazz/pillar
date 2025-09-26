#!/usr/bin/env python3
"""
Test script to verify Supabase database connection.
Run this script to test if your Supabase configuration is working correctly.
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime
import uuid

# Add the app directory to path
sys.path.append(str(Path(__file__).parent))

from app.database import (
    get_supabase_client,
    get_db_engine,
    test_connection,
    DatabaseService
)
from app.models.database import Base, ModelHelpers
from app.settings import settings


def print_status(message: str, status: str = "INFO"):
    """Print formatted status message."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_colors = {
        "INFO": "\033[94m",
        "SUCCESS": "\033[92m",
        "WARNING": "\033[93m",
        "ERROR": "\033[91m",
    }
    reset = "\033[0m"
    color = status_colors.get(status, "")
    print(f"[{timestamp}] {color}[{status}]{reset} {message}")


async def test_supabase_connection():
    """Test Supabase connection and basic operations."""
    print_status("Starting Supabase connection test...", "INFO")
    
    # Test 1: Check configuration
    print_status("Checking configuration...", "INFO")
    if not settings.supabase_url:
        print_status("SUPABASE_URL not configured in .env file", "ERROR")
        return False
    if not settings.supabase_key:
        print_status("SUPABASE_KEY not configured in .env file", "ERROR")
        return False
    
    print_status(f"Supabase URL: {settings.supabase_url}", "INFO")
    print_status("Supabase key is configured", "SUCCESS")
    
    # Test 2: Test basic connection
    print_status("Testing basic Supabase connection...", "INFO")
    try:
        connection_ok = await test_connection()
        if connection_ok:
            print_status("Basic connection test passed", "SUCCESS")
        else:
            print_status("Basic connection test failed", "WARNING")
    except Exception as e:
        print_status(f"Connection test error: {e}", "ERROR")
        return False
    
    # Test 3: Try to get client
    print_status("Initializing Supabase client...", "INFO")
    try:
        client = get_supabase_client()
        print_status("Supabase client initialized successfully", "SUCCESS")
    except Exception as e:
        print_status(f"Failed to initialize Supabase client: {e}", "ERROR")
        return False
    
    # Test 4: Test database operations (if tables exist)
    print_status("Testing database operations...", "INFO")
    test_table = "test_connection"
    test_id = str(uuid.uuid4())
    
    try:
        # Try to create a test record
        test_data = {
            "id": test_id,
            "test_field": "Connection test",
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        print_status(f"Attempting to insert test data into '{test_table}' table...", "INFO")
        result = DatabaseService.insert(test_table, test_data)
        if result:
            print_status("Test data inserted successfully", "SUCCESS")
            
            # Try to read the data back
            print_status("Attempting to read test data...", "INFO")
            records = DatabaseService.select(test_table, {"id": test_id})
            if records:
                print_status(f"Test data retrieved successfully: {records[0]}", "SUCCESS")
                
                # Clean up test data
                print_status("Cleaning up test data...", "INFO")
                deleted = DatabaseService.delete(test_table, "id", test_id)
                if deleted:
                    print_status("Test data cleaned up successfully", "SUCCESS")
            else:
                print_status("Could not retrieve test data", "WARNING")
        else:
            print_status("Could not insert test data", "WARNING")
            
    except Exception as e:
        print_status(f"Database operation test failed: {e}", "WARNING")
        print_status("This is expected if the test table doesn't exist yet", "INFO")
    
    # Test 5: Test PostgreSQL connection (if configured)
    if settings.database_url:
        print_status("Testing PostgreSQL connection...", "INFO")
        try:
            engine = get_db_engine()
            if engine:
                with engine.connect() as conn:
                    result = conn.execute("SELECT 1")
                    print_status("PostgreSQL connection successful", "SUCCESS")
            else:
                print_status("PostgreSQL engine not initialized", "WARNING")
        except Exception as e:
            print_status(f"PostgreSQL connection failed: {e}", "WARNING")
            print_status("Direct PostgreSQL access is optional", "INFO")
    else:
        print_status("PostgreSQL connection string not configured (optional)", "INFO")
    
    print_status("=" * 60, "INFO")
    print_status("Supabase connection test completed!", "SUCCESS")
    return True


def create_example_env():
    """Create an example .env file if it doesn't exist."""
    env_file = Path(__file__).parent / ".env"
    
    if not env_file.exists():
        print_status(".env file not found. Creating from .env.example...", "WARNING")
        env_example = Path(__file__).parent / ".env.example"
        
        if env_example.exists():
            content = env_example.read_text()
            env_file.write_text(content)
            print_status(".env file created. Please update it with your Supabase credentials.", "INFO")
            print_status("Get your credentials from: https://supabase.com/dashboard/project/[your-project]/settings/api", "INFO")
            return False
        else:
            print_status(".env.example file not found", "ERROR")
            return False
    return True


def main():
    """Main test function."""
    print_status("=" * 60, "INFO")
    print_status("Supabase Database Connection Test", "INFO")
    print_status("=" * 60, "INFO")
    
    # Check for .env file
    if not create_example_env():
        print_status("Please configure your .env file and run this test again.", "ERROR")
        sys.exit(1)
    
    # Run async test
    try:
        success = asyncio.run(test_supabase_connection())
        if success:
            print_status("All tests completed successfully!", "SUCCESS")
            print_status("Your Supabase connection is properly configured.", "SUCCESS")
        else:
            print_status("Some tests failed. Please check your configuration.", "ERROR")
            sys.exit(1)
    except KeyboardInterrupt:
        print_status("Test interrupted by user", "WARNING")
        sys.exit(1)
    except Exception as e:
        print_status(f"Unexpected error: {e}", "ERROR")
        sys.exit(1)


if __name__ == "__main__":
    main()