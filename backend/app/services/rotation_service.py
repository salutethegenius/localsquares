"""
Rotation Service for LocalSquares
Implements impression-balanced weighted shuffle for fair card distribution.

Algorithm Summary:
- Base weight: 1 / (impressions_24h + 1)
- New card boost: 2x → 1x decay over 72 hours
- Updated card boost: 1.3x for 7 days after update
- Already-seen penalty: 0.5x for same visitor same day
- Featured cards: Reserved slot in positions 1-4
"""
import random
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from uuid import UUID
from app.core.database import get_supabase_client
from supabase import Client


class RotationService:
    """Service for rotating pins with fair impression distribution."""
    
    # Configuration
    NEW_CARD_BOOST_MAX = 2.0  # Initial boost for new cards
    NEW_CARD_DECAY_HOURS = 72  # Hours until boost decays to 1x
    UPDATE_BOOST = 1.3  # Boost for recently updated cards
    UPDATE_BOOST_DAYS = 7  # Days the update boost lasts
    SEEN_PENALTY = 0.5  # Penalty for cards seen by same session today
    FEATURED_POSITIONS = [0, 1, 2, 3]  # Positions where featured can appear (0-indexed)
    
    def __init__(self):
        self.supabase: Client = get_supabase_client()
    
    def get_rotated_pins(
        self,
        board_id: UUID,
        session_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get pins for a board with fair rotation.
        
        Args:
            board_id: The board to get pins for
            session_id: Visitor session ID for seen penalty
            limit: Maximum pins to return
        
        Returns:
            List of pins sorted by weighted shuffle
        """
        now = datetime.now(timezone.utc)
        today = now.date()
        
        # 1. Get all active pins for the board
        pins_response = self.supabase.table("pins").select(
            "*, subscriptions(status)"
        ).eq(
            "board_id", str(board_id)
        ).eq(
            "status", "active"
        ).execute()
        
        pins = pins_response.data
        
        if not pins:
            return []
        
        # 2. Get today's featured booking for this board
        featured_response = self.supabase.table("featured_bookings").select(
            "pin_id"
        ).eq(
            "board_id", str(board_id)
        ).eq(
            "featured_date", today.isoformat()
        ).eq(
            "payment_status", "paid"
        ).execute()
        
        featured_pin_id = None
        if featured_response.data:
            featured_pin_id = featured_response.data[0]["pin_id"]
        
        # 3. Get pins seen by this session today (for seen penalty)
        seen_pin_ids = set()
        if session_id:
            seen_response = self.supabase.table("impressions").select(
                "pin_id"
            ).eq(
                "session_id", session_id
            ).eq(
                "board_id", str(board_id)
            ).gte(
                "created_at", today.isoformat()
            ).execute()
            
            seen_pin_ids = {row["pin_id"] for row in seen_response.data}
        
        # 4. Calculate weights for each pin
        weighted_pins = []
        featured_pin = None
        
        for pin in pins:
            # Skip pins without active subscription (except during trial)
            subscription = pin.get("subscriptions")
            if subscription and subscription.get("status") not in ["active", "past_due"]:
                continue
            
            pin_id = pin["id"]
            
            # Check if this is the featured pin
            if pin_id == featured_pin_id:
                featured_pin = pin
                continue  # Handle featured separately
            
            weight = self._calculate_weight(pin, now, pin_id in seen_pin_ids)
            weighted_pins.append((pin, weight))
        
        # 5. Weighted shuffle
        shuffled = self._weighted_shuffle(weighted_pins)
        
        # 6. Insert featured pin in a random position 1-4 (if exists)
        if featured_pin:
            insert_position = random.choice(self.FEATURED_POSITIONS)
            insert_position = min(insert_position, len(shuffled))
            shuffled.insert(insert_position, featured_pin)
        
        # 7. Limit results
        return shuffled[:limit]
    
    def _calculate_weight(
        self,
        pin: Dict[str, Any],
        now: datetime,
        was_seen: bool
    ) -> float:
        """Calculate the rotation weight for a pin."""
        
        # Base weight: inverse of impressions (fewer impressions = higher weight)
        impressions_24h = pin.get("impressions_24h", 0)
        base_weight = 1.0 / (impressions_24h + 1)
        
        # New card boost (decays from 2x to 1x over 72 hours)
        created_at = self._parse_datetime(pin.get("created_at"))
        if created_at:
            hours_since_creation = (now - created_at).total_seconds() / 3600
            if hours_since_creation < self.NEW_CARD_DECAY_HOURS:
                # Linear decay from 2x to 1x
                decay_factor = hours_since_creation / self.NEW_CARD_DECAY_HOURS
                new_boost = self.NEW_CARD_BOOST_MAX - (decay_factor * (self.NEW_CARD_BOOST_MAX - 1))
                base_weight *= new_boost
        
        # Update boost (1.3x for 7 days after content update)
        content_updated_at = self._parse_datetime(pin.get("content_updated_at"))
        if content_updated_at:
            days_since_update = (now - content_updated_at).days
            if days_since_update < self.UPDATE_BOOST_DAYS:
                base_weight *= self.UPDATE_BOOST
        
        # Seen penalty (0.5x if seen by same session today)
        if was_seen:
            base_weight *= self.SEEN_PENALTY
        
        return base_weight
    
    def _weighted_shuffle(
        self,
        weighted_items: List[tuple]
    ) -> List[Dict[str, Any]]:
        """
        Perform a weighted shuffle.
        Items with higher weights are more likely to appear earlier.
        """
        if not weighted_items:
            return []
        
        result = []
        items = list(weighted_items)
        
        while items:
            # Calculate cumulative weights
            total_weight = sum(w for _, w in items)
            if total_weight <= 0:
                # If all weights are 0, just shuffle randomly
                remaining = [item for item, _ in items]
                random.shuffle(remaining)
                result.extend(remaining)
                break
            
            # Pick a random point in the weight distribution
            pick = random.uniform(0, total_weight)
            
            # Find which item this corresponds to
            cumulative = 0
            for i, (item, weight) in enumerate(items):
                cumulative += weight
                if cumulative >= pick:
                    result.append(item)
                    items.pop(i)
                    break
        
        return result
    
    def _parse_datetime(self, dt_str: Optional[str]) -> Optional[datetime]:
        """Parse a datetime string from the database."""
        if not dt_str:
            return None
        try:
            # Handle various formats
            if dt_str.endswith("Z"):
                dt_str = dt_str[:-1] + "+00:00"
            return datetime.fromisoformat(dt_str)
        except ValueError:
            return None
    
    def record_impression(
        self,
        pin_id: UUID,
        board_id: UUID,
        session_id: Optional[str] = None,
        user_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """Record an impression for rotation tracking."""
        self.supabase.table("impressions").insert({
            "pin_id": str(pin_id),
            "board_id": str(board_id),
            "session_id": session_id,
            "user_id": str(user_id) if user_id else None,
            "ip_address": ip_address,
            "user_agent": user_agent
        }).execute()
    
    def reset_daily_impressions(self) -> int:
        """
        Reset 24h impression counts for pins.
        Called by scheduled job.
        Returns count of reset pins.
        """
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(hours=24)
        
        # Find pins that haven't been reset in 24 hours
        response = self.supabase.table("pins").select("id").lt(
            "last_impression_reset", cutoff.isoformat()
        ).execute()
        
        if not response.data:
            return 0
        
        # Reset each pin
        for pin in response.data:
            self.supabase.table("pins").update({
                "impressions_24h": 0,
                "last_impression_reset": now.isoformat()
            }).eq("id", pin["id"]).execute()
        
        return len(response.data)


# Factory function
def get_rotation_service() -> RotationService:
    """Get rotation service instance."""
    return RotationService()


