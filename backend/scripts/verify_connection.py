#!/usr/bin/env python3
"""Verify Supabase connection and check if migrations are needed."""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def verify_connection():
    """Verify Supabase connection."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env")
        return False
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Test connection by checking if we can query
        result = supabase.table("users").select("count", count="exact").execute()
        print(f"✅ Successfully connected to Supabase at {supabase_url}")
        
        # Check if tables exist
        tables_to_check = ["users", "boards", "pins", "pin_slots", "impressions", "clicks"]
        existing_tables = []
        missing_tables = []
        
        for table in tables_to_check:
            try:
                supabase.table(table).select("count", count="exact").limit(1).execute()
                existing_tables.append(table)
            except Exception as e:
                if "relation" in str(e).lower() or "does not exist" in str(e).lower():
                    missing_tables.append(table)
                else:
                    # Table might exist but have permissions issues
                    existing_tables.append(table)
        
        if missing_tables:
            print(f"\n⚠️  Missing tables: {', '.join(missing_tables)}")
            print("   Run migrations to create these tables.")
        else:
            print(f"\n✅ All tables exist: {', '.join(existing_tables)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {e}")
        return False

if __name__ == "__main__":
    verify_connection()

