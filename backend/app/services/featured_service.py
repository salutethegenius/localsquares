"""
Featured Booking Service for LocalSquares
Handles booking and managing featured spots on boards.
"""
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from uuid import UUID
from app.core.database import get_supabase_client
from app.services.stripe_service import get_stripe_service, StripeService
from app.services.subscription_service import get_subscription_service
from supabase import Client


class FeaturedService:
    """Service for managing featured spot bookings."""
    
    FEATURED_PRICE_CENTS = 500  # $5.00
    MAX_ADVANCE_DAYS = 30  # Can book up to 30 days ahead
    
    def __init__(self):
        self.supabase: Client = get_supabase_client()
        self.stripe: StripeService = get_stripe_service()
        self.table = "featured_bookings"
    
    # ==================== Availability ====================
    
    def get_availability(
        self,
        board_id: UUID,
        user_id: Optional[UUID] = None,
        days: int = 14
    ) -> List[Dict[str, Any]]:
        """
        Get featured spot availability for the next N days.
        
        Returns list of dates with availability status.
        """
        today = date.today()
        start_date = today + timedelta(days=1)  # Can't book same day
        end_date = today + timedelta(days=min(days, self.MAX_ADVANCE_DAYS))
        
        # Get existing bookings
        response = self.supabase.table(self.table).select(
            "featured_date, user_id, payment_status"
        ).eq(
            "board_id", str(board_id)
        ).gte(
            "featured_date", start_date.isoformat()
        ).lte(
            "featured_date", end_date.isoformat()
        ).execute()
        
        # Build lookup of booked dates
        booked_dates = {}
        for booking in response.data:
            if booking["payment_status"] in ["pending", "paid"]:
                booked_dates[booking["featured_date"]] = booking["user_id"]
        
        # Build availability list
        availability = []
        current = start_date
        while current <= end_date:
            date_str = current.isoformat()
            booked_by = booked_dates.get(date_str)
            
            availability.append({
                "date": date_str,
                "is_available": booked_by is None,
                "booked_by_user": booked_by == str(user_id) if user_id else False
            })
            current += timedelta(days=1)
        
        return availability
    
    def is_date_available(self, board_id: UUID, featured_date: date) -> bool:
        """Check if a specific date is available for booking."""
        today = date.today()
        
        # Can't book same day or in the past
        if featured_date <= today:
            return False
        
        # Can't book too far in advance
        if featured_date > today + timedelta(days=self.MAX_ADVANCE_DAYS):
            return False
        
        # Check if already booked
        response = self.supabase.table(self.table).select("id").eq(
            "board_id", str(board_id)
        ).eq(
            "featured_date", featured_date.isoformat()
        ).in_(
            "payment_status", ["pending", "paid"]
        ).execute()
        
        return len(response.data) == 0
    
    # ==================== Booking ====================
    
    def create_booking(
        self,
        pin_id: UUID,
        board_id: UUID,
        user_id: UUID,
        featured_date: date,
        payment_method_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a featured spot booking.
        
        Requires active subscription and charges $5.
        """
        # 1. Verify user has active subscription
        sub_service = get_subscription_service()
        if not sub_service.is_subscription_active(user_id):
            raise ValueError("Active subscription required to book featured spots")
        
        # 2. Check date availability
        if not self.is_date_available(board_id, featured_date):
            raise ValueError("This date is not available for booking")
        
        # 3. Verify pin belongs to user and board
        pin_response = self.supabase.table("pins").select("id, user_id, board_id").eq(
            "id", str(pin_id)
        ).execute()
        
        if not pin_response.data:
            raise ValueError("Pin not found")
        
        pin = pin_response.data[0]
        if pin["user_id"] != str(user_id):
            raise ValueError("You can only feature your own pins")
        if pin["board_id"] != str(board_id):
            raise ValueError("Pin must belong to the selected board")
        
        # 4. Get user's Stripe customer ID
        subscription = sub_service.get_by_user_id(user_id)
        if not subscription or not subscription.get("stripe_customer_id"):
            raise ValueError("No payment method on file")
        
        customer_id = subscription["stripe_customer_id"]
        
        # 5. Create payment intent
        payment_intent = self.stripe.create_featured_payment(
            customer_id=customer_id,
            pin_id=pin_id,
            board_id=board_id,
            featured_date=featured_date.isoformat()
        )
        
        # 6. Create booking record
        booking_data = {
            "pin_id": str(pin_id),
            "board_id": str(board_id),
            "user_id": str(user_id),
            "featured_date": featured_date.isoformat(),
            "amount_cents": self.FEATURED_PRICE_CENTS,
            "stripe_payment_intent_id": payment_intent.id,
            "payment_status": "pending"
        }
        
        response = self.supabase.table(self.table).insert(booking_data).execute()
        
        result = response.data[0]
        result["client_secret"] = payment_intent.client_secret
        
        return result
    
    def confirm_booking(self, booking_id: UUID) -> Dict[str, Any]:
        """Mark a booking as paid (called after payment confirmation)."""
        response = self.supabase.table(self.table).update({
            "payment_status": "paid"
        }).eq("id", str(booking_id)).execute()
        
        return response.data[0] if response.data else None
    
    # ==================== User Bookings ====================
    
    def get_user_bookings(
        self,
        user_id: UUID,
        include_past: bool = False
    ) -> List[Dict[str, Any]]:
        """Get all bookings for a user."""
        query = self.supabase.table(self.table).select(
            "*, pins(title, image_url), boards(display_name)"
        ).eq("user_id", str(user_id))
        
        if not include_past:
            today = date.today()
            query = query.gte("featured_date", today.isoformat())
        
        query = query.order("featured_date")
        response = query.execute()
        
        return response.data
    
    def cancel_booking(self, booking_id: UUID, user_id: UUID) -> bool:
        """
        Cancel a booking.
        Only allowed if:
        - Booking belongs to user
        - Featured date is in the future
        - Payment is still pending or can be refunded
        """
        # Get the booking
        response = self.supabase.table(self.table).select("*").eq(
            "id", str(booking_id)
        ).execute()
        
        if not response.data:
            return False
        
        booking = response.data[0]
        
        # Verify ownership
        if booking["user_id"] != str(user_id):
            return False
        
        # Can't cancel past dates
        featured_date = date.fromisoformat(booking["featured_date"])
        if featured_date <= date.today():
            return False
        
        # TODO: Handle refund if already paid
        # For now, just delete the booking
        self.supabase.table(self.table).delete().eq(
            "id", str(booking_id)
        ).execute()
        
        return True
    
    # ==================== Board Featured Pin ====================
    
    def get_today_featured_pin(self, board_id: UUID) -> Optional[Dict[str, Any]]:
        """Get today's featured pin for a board."""
        today = date.today()
        
        response = self.supabase.table(self.table).select(
            "pin_id, pins(*)"
        ).eq(
            "board_id", str(board_id)
        ).eq(
            "featured_date", today.isoformat()
        ).eq(
            "payment_status", "paid"
        ).execute()
        
        if response.data and response.data[0].get("pins"):
            return response.data[0]["pins"]
        return None


# Factory function
def get_featured_service() -> FeaturedService:
    """Get featured service instance."""
    return FeaturedService()


