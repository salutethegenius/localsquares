"""
Subscription Service for LocalSquares
Manages subscription lifecycle: trial, conversion, cancellation.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from uuid import UUID
from app.core.database import get_supabase_client
from app.services.stripe_service import get_stripe_service, StripeService
from supabase import Client
import stripe


class SubscriptionService:
    """Service for managing user subscriptions."""
    
    TRIAL_DAYS = 7
    
    def __init__(self):
        self.supabase: Client = get_supabase_client()
        self.stripe: StripeService = get_stripe_service()
        self.table = "subscriptions"
    
    # ==================== Subscription CRUD ====================
    
    def get_by_user_id(self, user_id: UUID) -> Optional[Dict[str, Any]]:
        """Get subscription for a user."""
        response = self.supabase.table(self.table).select("*").eq(
            "user_id", str(user_id)
        ).execute()
        return response.data[0] if response.data else None
    
    def get_by_stripe_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Get subscription by Stripe customer ID."""
        response = self.supabase.table(self.table).select("*").eq(
            "stripe_customer_id", customer_id
        ).execute()
        return response.data[0] if response.data else None
    
    def get_by_stripe_subscription(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        """Get subscription by Stripe subscription ID."""
        response = self.supabase.table(self.table).select("*").eq(
            "stripe_subscription_id", subscription_id
        ).execute()
        return response.data[0] if response.data else None
    
    # ==================== Trial Flow ====================
    
    async def start_trial(
        self,
        user_id: UUID,
        email: str,
        payment_method_id: str,
        name: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Start a trial subscription:
        1. Create Stripe customer
        2. Charge $1 trial fee
        3. Create subscription with 7-day trial
        4. Store subscription in database
        """
        # Check if user already has a subscription
        existing = self.get_by_user_id(user_id)
        if existing:
            raise ValueError("User already has a subscription")
        
        # 1. Create Stripe customer
        customer = self.stripe.create_customer(
            email=email,
            user_id=user_id,
            name=name,
            phone=phone
        )
        
        try:
            # 2. Charge $1 trial fee
            payment = self.stripe.create_trial_payment(
                customer_id=customer.id,
                payment_method_id=payment_method_id
            )
            
            if payment.status != "succeeded":
                raise ValueError(f"Trial payment failed: {payment.status}")
            
            # 3. Create subscription with trial period
            stripe_subscription = self.stripe.create_monthly_subscription(
                customer_id=customer.id,
                trial_days=self.TRIAL_DAYS
            )
            
            # 4. Store in database
            now = datetime.now(timezone.utc)
            trial_end = now + timedelta(days=self.TRIAL_DAYS)
            
            subscription_data = {
                "user_id": str(user_id),
                "plan": "trial",
                "status": "active",
                "stripe_customer_id": customer.id,
                "stripe_subscription_id": stripe_subscription.id,
                "stripe_payment_method_id": payment_method_id,
                "current_period_start": now.isoformat(),
                "current_period_end": trial_end.isoformat(),
                "trial_end": trial_end.isoformat()
            }
            
            response = self.supabase.table(self.table).insert(
                subscription_data
            ).execute()
            
            return response.data[0]
            
        except stripe.error.StripeError as e:
            # Clean up customer if something went wrong
            stripe.Customer.delete(customer.id)
            raise ValueError(f"Stripe error: {str(e)}")
    
    async def start_demo_trial(
        self,
        user_id: UUID,
        email: str
    ) -> Dict[str, Any]:
        """
        Start a demo trial subscription without payment.
        Used for testing and demo purposes.
        Creates a local subscription without Stripe integration.
        """
        # Check if user already has a subscription
        existing = self.get_by_user_id(user_id)
        if existing:
            raise ValueError("User already has a subscription")
        
        # Create demo subscription in database
        now = datetime.now(timezone.utc)
        trial_end = now + timedelta(days=self.TRIAL_DAYS)
        
        subscription_data = {
            "user_id": str(user_id),
            "plan": "trial",
            "status": "active",
            "current_period_start": now.isoformat(),
            "current_period_end": trial_end.isoformat(),
            "trial_end": trial_end.isoformat()
        }
        
        response = self.supabase.table(self.table).insert(
            subscription_data
        ).execute()
        
        return response.data[0]
    
    # ==================== Conversion Flow ====================
    
    def convert_trial_to_paid(
        self,
        user_id: UUID,
        plan: str = "monthly"
    ) -> Dict[str, Any]:
        """
        Convert trial to paid subscription.
        Called when trial ends or user manually upgrades.
        """
        subscription = self.get_by_user_id(user_id)
        if not subscription:
            raise ValueError("No subscription found")
        
        if subscription["status"] not in ["active", "past_due"]:
            raise ValueError("Subscription is not active")
        
        # Update plan in database
        update_data = {
            "plan": plan,
            "trial_end": None  # Clear trial end
        }
        
        response = self.supabase.table(self.table).update(
            update_data
        ).eq("user_id", str(user_id)).execute()
        
        return response.data[0]
    
    def upgrade_to_annual(self, user_id: UUID) -> Dict[str, Any]:
        """Upgrade from monthly to annual plan."""
        subscription = self.get_by_user_id(user_id)
        if not subscription:
            raise ValueError("No subscription found")
        
        if not subscription.get("stripe_subscription_id"):
            raise ValueError("No Stripe subscription found")
        
        # Update in Stripe
        from app.core.config import settings
        self.stripe.update_subscription_plan(
            subscription["stripe_subscription_id"],
            settings.stripe_price_annual
        )
        
        # Update in database
        response = self.supabase.table(self.table).update({
            "plan": "annual"
        }).eq("user_id", str(user_id)).execute()
        
        return response.data[0]
    
    # ==================== Cancellation Flow ====================
    
    def cancel_subscription(
        self,
        user_id: UUID,
        at_period_end: bool = True
    ) -> Dict[str, Any]:
        """
        Cancel a subscription.
        By default, cancels at end of billing period.
        """
        subscription = self.get_by_user_id(user_id)
        if not subscription:
            raise ValueError("No subscription found")
        
        # Cancel in Stripe
        if subscription.get("stripe_subscription_id"):
            self.stripe.cancel_subscription(
                subscription["stripe_subscription_id"],
                at_period_end=at_period_end
            )
        
        # Update in database
        update_data: Dict[str, Any] = {
            "cancel_at_period_end": at_period_end
        }
        
        if not at_period_end:
            update_data["status"] = "canceled"
            update_data["canceled_at"] = datetime.now(timezone.utc).isoformat()
        
        response = self.supabase.table(self.table).update(
            update_data
        ).eq("user_id", str(user_id)).execute()
        
        return response.data[0]
    
    def reactivate_subscription(self, user_id: UUID) -> Dict[str, Any]:
        """Reactivate a subscription that was set to cancel."""
        subscription = self.get_by_user_id(user_id)
        if not subscription:
            raise ValueError("No subscription found")
        
        if not subscription.get("cancel_at_period_end"):
            raise ValueError("Subscription is not set to cancel")
        
        # Reactivate in Stripe
        if subscription.get("stripe_subscription_id"):
            self.stripe.reactivate_subscription(
                subscription["stripe_subscription_id"]
            )
        
        # Update in database
        response = self.supabase.table(self.table).update({
            "cancel_at_period_end": False,
            "canceled_at": None
        }).eq("user_id", str(user_id)).execute()
        
        return response.data[0]
    
    # ==================== Status Checks ====================
    
    def is_subscription_active(self, user_id: UUID) -> bool:
        """Check if user has an active subscription."""
        subscription = self.get_by_user_id(user_id)
        if not subscription:
            return False
        return subscription["status"] in ["active", "past_due"]
    
    def is_trial_active(self, user_id: UUID) -> bool:
        """Check if user is in trial period."""
        subscription = self.get_by_user_id(user_id)
        if not subscription:
            return False
        if subscription["plan"] != "trial":
            return False
        if subscription["trial_end"]:
            trial_end = datetime.fromisoformat(subscription["trial_end"].replace("Z", "+00:00"))
            return datetime.now(timezone.utc) < trial_end
        return False
    
    def get_days_until_trial_end(self, user_id: UUID) -> Optional[int]:
        """Get number of days until trial ends."""
        subscription = self.get_by_user_id(user_id)
        if not subscription or not subscription.get("trial_end"):
            return None
        
        trial_end = datetime.fromisoformat(subscription["trial_end"].replace("Z", "+00:00"))
        delta = trial_end - datetime.now(timezone.utc)
        return max(0, delta.days)
    
    # ==================== Webhook Handlers ====================
    
    def handle_subscription_updated(
        self,
        stripe_subscription: stripe.Subscription
    ) -> Optional[Dict[str, Any]]:
        """Handle subscription.updated webhook event."""
        subscription = self.get_by_stripe_subscription(stripe_subscription.id)
        if not subscription:
            return None
        
        # Map Stripe status to our status
        status_map = {
            "active": "active",
            "past_due": "past_due",
            "canceled": "canceled",
            "unpaid": "past_due",
            "incomplete": "active",
            "incomplete_expired": "expired",
            "trialing": "active"
        }
        
        update_data = {
            "status": status_map.get(stripe_subscription.status, "active"),
            "current_period_start": datetime.fromtimestamp(
                stripe_subscription.current_period_start, tz=timezone.utc
            ).isoformat(),
            "current_period_end": datetime.fromtimestamp(
                stripe_subscription.current_period_end, tz=timezone.utc
            ).isoformat(),
            "cancel_at_period_end": stripe_subscription.cancel_at_period_end
        }
        
        # Check if trial ended
        if stripe_subscription.status == "active" and subscription["plan"] == "trial":
            update_data["plan"] = "monthly"
            update_data["trial_end"] = None
        
        response = self.supabase.table(self.table).update(
            update_data
        ).eq("id", subscription["id"]).execute()
        
        return response.data[0] if response.data else None
    
    def handle_subscription_deleted(
        self,
        stripe_subscription: stripe.Subscription
    ) -> Optional[Dict[str, Any]]:
        """Handle subscription.deleted webhook event."""
        subscription = self.get_by_stripe_subscription(stripe_subscription.id)
        if not subscription:
            return None
        
        response = self.supabase.table(self.table).update({
            "status": "canceled",
            "canceled_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", subscription["id"]).execute()
        
        return response.data[0] if response.data else None
    
    def handle_payment_failed(
        self,
        stripe_invoice: stripe.Invoice
    ) -> Optional[Dict[str, Any]]:
        """Handle invoice.payment_failed webhook event."""
        customer_id = stripe_invoice.customer
        subscription = self.get_by_stripe_customer(customer_id)
        if not subscription:
            return None
        
        response = self.supabase.table(self.table).update({
            "status": "past_due"
        }).eq("id", subscription["id"]).execute()
        
        return response.data[0] if response.data else None
    
    # ==================== Expiration Handling ====================
    
    def expire_ended_trials(self) -> int:
        """
        Find and expire trials that have ended.
        Called by scheduled job.
        Returns count of expired subscriptions.
        """
        now = datetime.now(timezone.utc)
        
        # Find active trials that have ended
        response = self.supabase.table(self.table).select("*").eq(
            "plan", "trial"
        ).eq(
            "status", "active"
        ).lt(
            "trial_end", now.isoformat()
        ).execute()
        
        expired_count = 0
        for sub in response.data:
            # Mark as expired
            self.supabase.table(self.table).update({
                "status": "expired"
            }).eq("id", sub["id"]).execute()
            
            # Deactivate associated pins
            self.supabase.table("pins").update({
                "status": "paused"
            }).eq(
                "subscription_id", sub["id"]
            ).execute()
            
            expired_count += 1
        
        return expired_count


# Factory function
def get_subscription_service() -> SubscriptionService:
    """Get subscription service instance."""
    return SubscriptionService()


