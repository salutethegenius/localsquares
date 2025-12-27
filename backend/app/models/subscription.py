"""Subscription models for LocalSquares."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class SubscriptionBase(BaseModel):
    """Base subscription model."""
    plan: str = Field(..., pattern="^(trial|monthly|annual)$")


class SubscriptionCreate(BaseModel):
    """Request to start a trial subscription."""
    payment_method_id: str = Field(..., description="Stripe payment method ID")
    name: Optional[str] = Field(None, description="Business/user name")
    phone: Optional[str] = Field(None, description="Phone number")


class SubscriptionResponse(BaseModel):
    """Subscription response model."""
    id: UUID
    user_id: UUID
    plan: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    trial_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    canceled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Computed fields (optional, added by API)
    days_remaining: Optional[int] = None
    is_trial: Optional[bool] = None
    
    class Config:
        from_attributes = True


class SubscriptionStatus(BaseModel):
    """Lightweight subscription status for quick checks."""
    has_subscription: bool
    is_active: bool
    is_trial: bool
    plan: Optional[str] = None
    days_remaining: Optional[int] = None
    cancel_at_period_end: bool = False


class UpgradePlanRequest(BaseModel):
    """Request to upgrade subscription plan."""
    plan: str = Field(..., pattern="^(monthly|annual)$")


class SetupIntentResponse(BaseModel):
    """Response with Stripe setup intent for collecting payment method."""
    client_secret: str


class PaymentMethodResponse(BaseModel):
    """Payment method info."""
    id: str
    brand: str
    last4: str
    exp_month: int
    exp_year: int


# ==================== Featured Booking Models ====================

class FeaturedBookingCreate(BaseModel):
    """Request to book a featured spot."""
    pin_id: UUID
    board_id: UUID
    featured_date: str = Field(..., description="Date in YYYY-MM-DD format")
    payment_method_id: Optional[str] = Field(
        None, 
        description="Payment method ID (uses default if not provided)"
    )


class FeaturedBookingResponse(BaseModel):
    """Featured booking response."""
    id: UUID
    pin_id: UUID
    board_id: UUID
    featured_date: str
    amount_cents: int
    payment_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class FeaturedAvailability(BaseModel):
    """Featured spot availability for a date range."""
    date: str
    is_available: bool
    booked_by_user: bool = False


