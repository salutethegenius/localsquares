from supabase import create_client, Client
from supabase._sync.client import SupabaseException
from app.core.config import settings
from typing import Optional

# Supabase client (lazy initialization - created on first access)
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Get Supabase client instance (lazy initialization)."""
    global _supabase_client
    if _supabase_client is None:
        try:
            _supabase_client = create_client(
                settings.supabase_url,
                settings.supabase_service_role_key
            )
        except SupabaseException as e:
            if "Invalid API key" in str(e):
                raise ValueError(
                    "Invalid Supabase credentials. Please check your .env file:\n"
                    "  - SUPABASE_URL should be your project URL (e.g., https://xxx.supabase.co)\n"
                    "  - SUPABASE_SERVICE_ROLE_KEY should be your service_role key (not anon key)\n"
                    "  - Get these from: Supabase Dashboard → Settings → API"
                ) from e
            raise
    return _supabase_client

