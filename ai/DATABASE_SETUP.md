# Supabase Database Setup Guide

This guide will help you set up and configure the Supabase database connection for the AI service.

## Prerequisites

- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- Python 3.8 or higher
- pip package manager

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- `supabase==2.10.0` - Supabase Python client
- `sqlalchemy==2.0.23` - SQL toolkit and ORM
- `psycopg2-binary==2.9.9` - PostgreSQL adapter

### 2. Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in the project details:
   - Project name
   - Database password (save this!)
   - Region (choose closest to your users)
4. Wait for the project to be created (~2 minutes)

### 3. Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (safe to use in client-side code)
   - **Service Role Key** (keep secret, use only server-side)

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_KEY=your-anon-key-here
   
   # Optional: Direct PostgreSQL connection (for advanced usage)
   DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
   ```

### 5. Create Database Tables

#### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click "New Query"
4. Copy and paste the contents of `create_database_tables.sql`
5. Click "Run" to create all tables and indexes

#### Option B: Using SQLAlchemy (Alternative)

```python
from app.database import get_db_engine
from app.models.database import Base, ModelHelpers

# Create engine and tables
engine = get_db_engine()
if engine:
    ModelHelpers.create_tables(engine)
```

### 6. Test Your Connection

Run the test script to verify everything is working:

```bash
python test_database_connection.py
```

You should see output like:
```
[2025-09-26 17:49:53] [INFO] Starting Supabase connection test...
[2025-09-26 17:49:53] [SUCCESS] Supabase key is configured
[2025-09-26 17:49:53] [SUCCESS] Supabase client initialized successfully
[2025-09-26 17:49:53] [SUCCESS] Supabase connection test completed!
```

## Project Structure

```
ai/
├── app/
│   ├── database.py           # Database connection and utilities
│   ├── models/
│   │   └── database.py       # SQLAlchemy models
│   └── settings.py           # Configuration management
├── create_database_tables.sql # SQL schema definition
├── test_database_connection.py # Connection test script
├── requirements.txt          # Python dependencies
├── .env.example             # Environment variables template
└── DATABASE_SETUP.md        # This file
```

## Usage Examples

### Basic CRUD Operations

```python
from app.database import DatabaseService

# Insert a record
contract = DatabaseService.insert('contracts', {
    'title': 'Service Agreement',
    'content': 'Contract content here...',
    'user_id': 'user-uuid',
    'status': 'draft'
})

# Select records
contracts = DatabaseService.select('contracts', 
    filters={'status': 'draft'}, 
    limit=10
)

# Update a record
updated = DatabaseService.update('contracts', 
    'id', contract['id'],
    {'status': 'review'}
)

# Delete a record
deleted = DatabaseService.delete('contracts', 'id', contract['id'])
```

### Using with FastAPI

```python
from fastapi import Depends
from app.database import get_db, get_supabase_client

@app.get("/contracts")
async def get_contracts():
    client = get_supabase_client()
    response = client.table('contracts').select("*").execute()
    return response.data
```

### Using SQLAlchemy Models

```python
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.database import Contract

@app.post("/contracts")
async def create_contract(db: Session = Depends(get_db)):
    if db:  # Database is configured
        new_contract = Contract(
            title="New Contract",
            user_id="user-uuid"
        )
        db.add(new_contract)
        db.commit()
        return new_contract
```

## Database Schema

### Core Tables

1. **contracts** - Store contract documents and metadata
2. **risk_analyses** - Risk assessment results
3. **search_results** - Cached search results
4. **workflows** - Contract workflow tracking
5. **document_templates** - Reusable document templates
6. **audit_logs** - Activity audit trail
7. **users** - User management (optional if using Supabase Auth)

### Features

- UUID primary keys for all tables
- JSONB columns for flexible metadata storage
- Automatic `updated_at` timestamps via triggers
- Indexes on frequently queried columns
- Foreign key constraints for data integrity
- Row Level Security support (optional)

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use environment-specific keys** (dev, staging, prod)
3. **Enable Row Level Security (RLS)** in production
4. **Use Service Role key only server-side**
5. **Implement proper authentication** before production
6. **Regular backups** using Supabase's built-in features

## Troubleshooting

### Connection Errors

If you see "SUPABASE_URL not configured":
- Ensure `.env` file exists and contains `SUPABASE_URL`
- Check that the URL format is correct: `https://xxxxx.supabase.co`

### Authentication Errors

If you get authentication failures:
- Verify your `SUPABASE_KEY` is correct
- Ensure you're using the anon key for client operations
- Check if RLS policies are blocking access

### Table Not Found

If operations fail with "table not found":
- Run the SQL script in `create_database_tables.sql`
- Verify tables exist in Supabase Table Editor

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Python Client](https://github.com/supabase/supabase-py)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For issues specific to this project:
1. Check the troubleshooting section above
2. Review the test output from `test_database_connection.py`
3. Check Supabase dashboard logs for database errors

For Supabase-specific issues:
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)