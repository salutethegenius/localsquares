#!/usr/bin/env python3
"""Set up Supabase storage bucket for pin images."""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def setup_storage_bucket():
    """Create and configure the pin-images storage bucket."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env")
        return False
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        bucket_name = "pin-images"
        
        # Check if bucket exists
        try:
            buckets = supabase.storage.list_buckets()
            existing_bucket = next((b for b in buckets if b.name == bucket_name), None)
            
            if existing_bucket:
                print(f"✅ Bucket '{bucket_name}' already exists")
                
                # Check if it's public
                if existing_bucket.public:
                    print(f"✅ Bucket is already public")
                else:
                    print(f"⚠️  Bucket exists but is not public")
                    print(f"   You may need to set it to public in the Supabase dashboard")
                
                return True
            else:
                print(f"📦 Creating bucket '{bucket_name}'...")
                
                # Create bucket (public)
                response = supabase.storage.create_bucket(
                    bucket_name,
                    options={
                        "public": True,
                        "file_size_limit": 5242880,  # 5MB
                        "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"]
                    }
                )
                
                print(f"✅ Bucket '{bucket_name}' created successfully")
                return True
                
        except Exception as e:
            # Try to create bucket (might fail if it exists or permissions issue)
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print(f"✅ Bucket '{bucket_name}' already exists")
                return True
            else:
                print(f"⚠️  Could not create bucket automatically: {e}")
                print(f"\n📝 Manual setup required:")
                print(f"   1. Go to Supabase Dashboard → Storage")
                print(f"   2. Click 'New bucket'")
                print(f"   3. Name: {bucket_name}")
                print(f"   4. Make it Public: Yes")
                print(f"   5. File size limit: 5MB")
                print(f"   6. Allowed MIME types: image/jpeg, image/png, image/webp")
                return False
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print(f"\n📝 Manual setup required:")
        print(f"   1. Go to Supabase Dashboard → Storage")
        print(f"   2. Click 'New bucket'")
        print(f"   3. Name: pin-images")
        print(f"   4. Make it Public: Yes")
        print(f"   5. File size limit: 5MB")
        print(f"   6. Allowed MIME types: image/jpeg, image/png, image/webp")
        return False

if __name__ == "__main__":
    setup_storage_bucket()

