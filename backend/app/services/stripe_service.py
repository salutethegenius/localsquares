"""
Stripe Service for LocalSquares
Handles payment processing, customer management, and subscriptions.
"""
import stripe
from typing import Optional, Dict, Any
from uuid import UUID
from app.core.config import settings


# Initialize Stripe
stripe.api_key = settings.stripe_secret_key


class StripeService:
    """Service for Stripe payment operations."""
    
    # Pricing configuration
    TRIAL_AMOUNT = 100  # $1.00 in cents
    MONTHLY_AMOUNT = 1400  # $14.00 in cents
    ANNUAL_AMOUNT = 12000  # $120.00 in cents
    FEATURED_AMOUNT = 500  # $5.00 in cents
    
    def __init__(self):
        if not settings.stripe_secret_key:
            raise ValueError("Stripe secret key not configured")
    
    # ==================== Customer Management ====================
    
    def create_customer(
        self,
        email: str,
        user_id: UUID,
        name: Optional[str] = None,
        phone: Optional[str] = None
    ) -> stripe.Customer:
        """Create a new Stripe customer."""
        return stripe.Customer.create(
            email=email,
            name=name,
            phone=phone,
            metadata={
                "user_id": str(user_id),
                "source": "localsquares"
            }
        )
    
    def get_customer(self, customer_id: str) -> Optional[stripe.Customer]:
        """Retrieve a Stripe customer."""
        try:
            return stripe.Customer.retrieve(customer_id)
        except stripe.error.InvalidRequestError:
            return None
    
    def update_customer(
        self,
        customer_id: str,
        email: Optional[str] = None,
        name: Optional[str] = None
    ) -> stripe.Customer:
        """Update a Stripe customer."""
        update_data = {}
        if email:
            update_data["email"] = email
        if name:
            update_data["name"] = name
        return stripe.Customer.modify(customer_id, **update_data)
    
    # ==================== Payment Methods ====================
    
    def attach_payment_method(
        self,
        payment_method_id: str,
        customer_id: str
    ) -> stripe.PaymentMethod:
        """Attach a payment method to a customer."""
        return stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id
        )
    
    def set_default_payment_method(
        self,
        customer_id: str,
        payment_method_id: str
    ) -> stripe.Customer:
        """Set the default payment method for a customer."""
        return stripe.Customer.modify(
            customer_id,
            invoice_settings={"default_payment_method": payment_method_id}
        )
    
    def list_payment_methods(self, customer_id: str) -> list:
        """List payment methods for a customer."""
        return stripe.PaymentMethod.list(
            customer=customer_id,
            type="card"
        ).data
    
    # ==================== Trial Payment ====================
    
    def create_trial_payment(
        self,
        customer_id: str,
        payment_method_id: str
    ) -> stripe.PaymentIntent:
        """
        Create a $1 trial payment intent.
        This validates the card and initiates the trial period.
        """
        # Set default payment method first
        self.set_default_payment_method(customer_id, payment_method_id)
        
        return stripe.PaymentIntent.create(
            amount=self.TRIAL_AMOUNT,
            currency="usd",
            customer=customer_id,
            payment_method=payment_method_id,
            confirm=True,
            automatic_payment_methods={
                "enabled": True,
                "allow_redirects": "never"
            },
            metadata={
                "type": "trial",
                "source": "localsquares"
            },
            description="LocalSquares 7-day trial"
        )
    
    # ==================== Subscriptions ====================
    
    def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        trial_days: Optional[int] = None
    ) -> stripe.Subscription:
        """
        Create a subscription for a customer.
        Use trial_days=7 for trial-to-paid conversion.
        """
        params: Dict[str, Any] = {
            "customer": customer_id,
            "items": [{"price": price_id}],
            "payment_behavior": "default_incomplete",
            "payment_settings": {
                "save_default_payment_method": "on_subscription"
            },
            "expand": ["latest_invoice.payment_intent"],
            "metadata": {
                "source": "localsquares"
            }
        }
        
        if trial_days:
            params["trial_period_days"] = trial_days
        
        return stripe.Subscription.create(**params)
    
    def create_monthly_subscription(
        self,
        customer_id: str,
        trial_days: int = 7
    ) -> stripe.Subscription:
        """Create a monthly subscription with optional trial."""
        return self.create_subscription(
            customer_id=customer_id,
            price_id=settings.stripe_price_monthly,
            trial_days=trial_days
        )
    
    def create_annual_subscription(
        self,
        customer_id: str
    ) -> stripe.Subscription:
        """Create an annual subscription (no trial needed)."""
        return self.create_subscription(
            customer_id=customer_id,
            price_id=settings.stripe_price_annual
        )
    
    def get_subscription(self, subscription_id: str) -> Optional[stripe.Subscription]:
        """Retrieve a subscription."""
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except stripe.error.InvalidRequestError:
            return None
    
    def cancel_subscription(
        self,
        subscription_id: str,
        at_period_end: bool = True
    ) -> stripe.Subscription:
        """
        Cancel a subscription.
        If at_period_end=True, cancels at end of billing period.
        """
        if at_period_end:
            return stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
        else:
            return stripe.Subscription.cancel(subscription_id)
    
    def reactivate_subscription(self, subscription_id: str) -> stripe.Subscription:
        """Reactivate a subscription that was set to cancel at period end."""
        return stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=False
        )
    
    def update_subscription_plan(
        self,
        subscription_id: str,
        new_price_id: str
    ) -> stripe.Subscription:
        """Change the plan of an existing subscription."""
        subscription = stripe.Subscription.retrieve(subscription_id)
        return stripe.Subscription.modify(
            subscription_id,
            items=[{
                "id": subscription["items"]["data"][0]["id"],
                "price": new_price_id
            }],
            proration_behavior="create_prorations"
        )
    
    # ==================== Featured Spot Payments ====================
    
    def create_featured_payment(
        self,
        customer_id: str,
        pin_id: UUID,
        board_id: UUID,
        featured_date: str
    ) -> stripe.PaymentIntent:
        """Create a payment intent for a featured spot booking."""
        return stripe.PaymentIntent.create(
            amount=self.FEATURED_AMOUNT,
            currency="usd",
            customer=customer_id,
            automatic_payment_methods={
                "enabled": True,
                "allow_redirects": "never"
            },
            metadata={
                "type": "featured",
                "pin_id": str(pin_id),
                "board_id": str(board_id),
                "featured_date": featured_date,
                "source": "localsquares"
            },
            description=f"LocalSquares Featured Spot - {featured_date}"
        )
    
    # ==================== Setup Intents ====================
    
    def create_setup_intent(self, customer_id: str) -> stripe.SetupIntent:
        """Create a setup intent for collecting payment method without charging."""
        return stripe.SetupIntent.create(
            customer=customer_id,
            automatic_payment_methods={
                "enabled": True,
                "allow_redirects": "never"
            },
            metadata={
                "source": "localsquares"
            }
        )
    
    # ==================== Webhook Handling ====================
    
    def construct_webhook_event(
        self,
        payload: bytes,
        sig_header: str
    ) -> stripe.Event:
        """Construct and verify a webhook event."""
        if not settings.stripe_webhook_secret:
            raise ValueError("Stripe webhook secret not configured")
        
        return stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.stripe_webhook_secret
        )
    
    # ==================== Invoices ====================
    
    def get_upcoming_invoice(self, customer_id: str) -> Optional[stripe.Invoice]:
        """Get the upcoming invoice for a customer."""
        try:
            return stripe.Invoice.upcoming(customer=customer_id)
        except stripe.error.InvalidRequestError:
            return None
    
    def list_invoices(
        self,
        customer_id: str,
        limit: int = 10
    ) -> list:
        """List invoices for a customer."""
        return stripe.Invoice.list(
            customer=customer_id,
            limit=limit
        ).data


# Singleton instance
stripe_service = StripeService() if settings.stripe_secret_key else None


def get_stripe_service() -> StripeService:
    """Get the Stripe service instance."""
    if stripe_service is None:
        raise ValueError("Stripe is not configured. Set STRIPE_SECRET_KEY in .env")
    return stripe_service


