#!/usr/bin/env python3
"""
Check and update Supabase configuration in .env file
"""

import os
import sys
from pathlib import Path

def check_env_config():
    """Check if Supabase is properly configured."""
    env_file = Path(".env")
    
    if not env_file.exists():
        print("❌ .env file not found!")
        print("Please create a .env file based on .env.example")
        return False
    
    with open(env_file, 'r') as f:
        content = f.read()
    
    has_url = 'SUPABASE_URL=' in content and not content.split('SUPABASE_URL=')[1].startswith('\n')
    has_key = 'SUPABASE_KEY=' in content and not content.split('SUPABASE_KEY=')[1].startswith('\n')
    
    print("Supabase Configuration Status:")
    print("-" * 40)
    
    if has_url:
        print("✅ SUPABASE_URL is configured")
    else:
        print("❌ SUPABASE_URL is missing or empty")
        print("   Please add: SUPABASE_URL=https://your-project-ref.supabase.co")
    
    if has_key:
        print("✅ SUPABASE_KEY is configured")
    else:
        print("❌ SUPABASE_KEY is missing or empty")
        print("   Please add: SUPABASE_KEY=your-anon-key-here")
    
    print("-" * 40)
    
    if has_url and has_key:
        print("✅ Supabase configuration looks good!")
        return True
    else:
        print("\n⚠️  Please update your .env file with the missing Supabase credentials")
        print("You can find these in your Supabase project settings:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Select your project")
        print("3. Go to Settings > API")
        print("4. Copy the Project URL and anon/public key")
        return False

def test_connection():
    """Test Supabase connection."""
    try:
        from app.database import get_supabase_client
        
        print("\nTesting Supabase connection...")
        client = get_supabase_client()
        
        # Try to query a simple table
        try:
            # This will fail gracefully if table doesn't exist
            response = client.table('contracts').select('id').limit(1).execute()
            print("✅ Successfully connected to Supabase!")
            print(f"   Contracts table exists with {len(response.data)} records (limited to 1)")
            return True
        except Exception as e:
            if "contracts" in str(e).lower() and "does not exist" in str(e).lower():
                print("⚠️  Connected to Supabase but 'contracts' table doesn't exist")
                print("   Please run the SQL script in create_database_tables.sql")
            else:
                print(f"⚠️  Connected to Supabase but query failed: {e}")
            return False
            
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        return False
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Checking Supabase Configuration...")
    print("=" * 50)
    
    config_ok = check_env_config()
    
    if config_ok:
        print("\n🔍 Testing Connection...")
        print("=" * 50)
        connection_ok = test_connection()
        
        if connection_ok:
            print("\n✅ Everything is configured correctly!")
            sys.exit(0)
        else:
            print("\n⚠️  Connection test failed. Please check your credentials.")
            sys.exit(1)
    else:
        print("\n❌ Please configure Supabase before proceeding.")
        sys.exit(1)