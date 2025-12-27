from typing import Optional
from uuid import UUID
from datetime import datetime
from app.core.database import get_supabase_client
from supabase import Client


class AnalyticsService:
    def __init__(self):
        self.supabase: Client = get_supabase_client()
    
    def track_impression(
        self,
        pin_id: UUID,
        board_id: UUID,
        session_id: Optional[str] = None,
        user_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        referrer: Optional[str] = None,
    ) -> bool:
        """Track a pin impression (view)."""
        try:
            data = {
                "pin_id": str(pin_id),
                "board_id": str(board_id),
                "session_id": session_id,
                "user_id": str(user_id) if user_id else None,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "referrer": referrer,
            }
            
            # Remove None values
            data = {k: v for k, v in data.items() if v is not None}
            
            response = self.supabase.table("impressions").insert(data).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error tracking impression: {e}")
            return False
    
    def track_click(
        self,
        pin_id: UUID,
        board_id: UUID,
        click_type: str = "pin",
        session_id: Optional[str] = None,
        user_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> bool:
        """Track a click/interaction."""
        try:
            if click_type not in ["pin", "contact", "website", "map", "share"]:
                click_type = "pin"
            
            data = {
                "pin_id": str(pin_id),
                "board_id": str(board_id),
                "click_type": click_type,
                "session_id": session_id,
                "user_id": str(user_id) if user_id else None,
                "ip_address": ip_address,
                "user_agent": user_agent,
            }
            
            # Remove None values
            data = {k: v for k, v in data.items() if v is not None}
            
            response = self.supabase.table("clicks").insert(data).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error tracking click: {e}")
            return False
    
    def get_pin_stats(self, pin_id: UUID, days: int = 7) -> dict:
        """Get statistics for a pin over the last N days."""
        try:
            cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            # Note: This is a simplified version. In production, use proper date arithmetic
            
            # Get impressions count
            impressions_response = self.supabase.table("impressions").select(
                "id", count="exact"
            ).eq("pin_id", str(pin_id)).execute()
            
            impressions_count = impressions_response.count if hasattr(impressions_response, 'count') else 0
            
            # Get clicks count
            clicks_response = self.supabase.table("clicks").select(
                "id", count="exact"
            ).eq("pin_id", str(pin_id)).execute()
            
            clicks_count = clicks_response.count if hasattr(clicks_response, 'count') else 0
            
            # Get clicks by type
            clicks_by_type_response = self.supabase.table("clicks").select(
                "click_type"
            ).eq("pin_id", str(pin_id)).execute()
            
            clicks_by_type = {}
            for click in clicks_by_type_response.data:
                click_type = click.get("click_type", "pin")
                clicks_by_type[click_type] = clicks_by_type.get(click_type, 0) + 1
            
            return {
                "impressions": impressions_count,
                "clicks": clicks_count,
                "clicks_by_type": clicks_by_type,
                "ctr": clicks_count / impressions_count if impressions_count > 0 else 0,
            }
        except Exception as e:
            print(f"Error getting pin stats: {e}")
            return {
                "impressions": 0,
                "clicks": 0,
                "clicks_by_type": {},
                "ctr": 0,
            }

