#!/usr/bin/env python3
"""Verify LocalSquares setup is complete."""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def verify_setup():
    """Verify all setup is complete."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env")
        return False
    
    print("🔍 Verifying LocalSquares setup...\n")
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Check database tables
        print("📊 Checking database tables...")
        tables_to_check = [
            "users", "boards", "pins", "pin_slots", 
            "impressions", "clicks", "payments", "reports"
        ]
        
        all_tables_exist = True
        for table in tables_to_check:
            try:
                supabase.table(table).select("count", count="exact").limit(1).execute()
                print(f"  ✅ {table}")
            except Exception as e:
                if "relation" in str(e).lower() or "does not exist" in str(e).lower():
                    print(f"  ❌ {table} - MISSING")
                    all_tables_exist = False
                else:
                    # Table might exist but have permissions issues
                    print(f"  ⚠️  {table} - exists but may have permission issues")
        
        if not all_tables_exist:
            print("\n❌ Some tables are missing. Run migrations first.")
            return False
        
        print("\n✅ All database tables exist")
        
        # Check storage bucket
        print("\n📦 Checking storage bucket...")
        try:
            buckets = supabase.storage.list_buckets()
            pin_images_bucket = next((b for b in buckets if b.name == "pin-images"), None)
            
            if pin_images_bucket:
                print(f"  ✅ pin-images bucket exists")
                if pin_images_bucket.public:
                    print(f"  ✅ Bucket is public")
                else:
                    print(f"  ⚠️  Bucket exists but is not public")
            else:
                print(f"  ❌ pin-images bucket NOT FOUND")
                print(f"     Create it in Supabase Dashboard → Storage")
                return False
        except Exception as e:
            print(f"  ⚠️  Could not check storage: {e}")
        
        # Check for initial boards (optional)
        print("\n🏘️  Checking boards...")
        try:
            boards_result = supabase.table("boards").select("id, slug, display_name").execute()
            if boards_result.data and len(boards_result.data) > 0:
                print(f"  ✅ Found {len(boards_result.data)} board(s):")
                for board in boards_result.data:
                    print(f"     - {board.get('display_name')} ({board.get('slug')})")
            else:
                print(f"  ℹ️  No boards yet (you can add them later)")
        except Exception as e:
            print(f"  ⚠️  Could not check boards: {e}")
        
        print("\n" + "="*50)
        print("✅ Setup verification complete!")
        print("="*50)
        print("\n🎉 LocalSquares is ready to use!")
        print("\n📝 Next steps:")
        print("   - Frontend: http://localhost:3000")
        print("   - Backend API: http://localhost:8000/docs")
        print("   - Configure authentication providers in Supabase")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during verification: {e}")
        return False

if __name__ == "__main__":
    verify_setup()

