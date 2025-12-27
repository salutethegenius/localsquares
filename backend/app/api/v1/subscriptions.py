"""
Subscription API endpoints for LocalSquares.
Handles subscription management and Stripe integration.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from uuid import UUID

from app.core.auth import get_current_user
from app.services.subscription_service import get_subscription_service, SubscriptionService
from app.services.stripe_service import get_stripe_service, StripeService
from app.models.subscription import (
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionStatus,
    UpgradePlanRequest,
    SetupIntentResponse,
    PaymentMethodResponse
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


def get_services():
    """Get subscription and stripe services."""
    return get_subscription_service(), get_stripe_service()


# ==================== Subscription Management ====================

@router.get("/status", response_model=SubscriptionStatus)
async def get_subscription_status(
    current_user = Depends(get_current_user)
):
    """Get current user's subscription status."""
    service = get_subscription_service()
    user_id = current_user.id
    
    subscription = service.get_by_user_id(user_id)
    
    if not subscription:
        return SubscriptionStatus(
            has_subscription=False,
            is_active=False,
            is_trial=False
        )
    
    is_active = subscription["status"] in ["active", "past_due"]
    is_trial = service.is_trial_active(user_id)
    days_remaining = service.get_days_until_trial_end(user_id) if is_trial else None
    
    return SubscriptionStatus(
        has_subscription=True,
        is_active=is_active,
        is_trial=is_trial,
        plan=subscription["plan"],
        days_remaining=days_remaining,
        cancel_at_period_end=subscription.get("cancel_at_period_end", False)
    )


@router.get("/", response_model=Optional[SubscriptionResponse])
async def get_subscription(
    current_user = Depends(get_current_user)
):
    """Get current user's full subscription details."""
    service = get_subscription_service()
    user_id = current_user.id
    
    subscription = service.get_by_user_id(user_id)
    
    if not subscription:
        return None
    
    # Add computed fields
    is_trial = service.is_trial_active(user_id)
    days_remaining = service.get_days_until_trial_end(user_id) if is_trial else None
    
    return SubscriptionResponse(
        **subscription,
        is_trial=is_trial,
        days_remaining=days_remaining
    )


@router.post("/trial", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def start_trial(
    data: Optional[SubscriptionCreate] = None,
    current_user = Depends(get_current_user)
):
    """
    Start a $1 trial subscription.
    If payment_method_id is provided, charges the card $1.
    Otherwise starts a demo trial without payment.
    After trial, auto-converts to $14/month.
    """
    service = get_subscription_service()
    user_id = current_user.id
    email = current_user.email
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User email is required for subscription"
        )
    
    try:
        if data and data.payment_method_id:
            # Full payment flow
            subscription = await service.start_trial(
                user_id=user_id,
                email=email,
                payment_method_id=data.payment_method_id,
                name=data.name,
                phone=data.phone
            )
        else:
            # Demo trial without payment
            subscription = await service.start_demo_trial(
                user_id=user_id,
                email=email
            )
        return SubscriptionResponse(**subscription, is_trial=True, days_remaining=7)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/upgrade", response_model=SubscriptionResponse)
async def upgrade_plan(
    data: UpgradePlanRequest,
    current_user = Depends(get_current_user)
):
    """Upgrade subscription plan (monthly to annual)."""
    service = get_subscription_service()
    user_id = current_user.id
    
    try:
        if data.plan == "annual":
            subscription = service.upgrade_to_annual(user_id)
        else:
            subscription = service.convert_trial_to_paid(user_id, data.plan)
        
        return SubscriptionResponse(**subscription)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    current_user = Depends(get_current_user)
):
    """Cancel subscription at end of billing period."""
    service = get_subscription_service()
    user_id = current_user.id
    
    try:
        subscription = service.cancel_subscription(user_id, at_period_end=True)
        return SubscriptionResponse(**subscription)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/reactivate", response_model=SubscriptionResponse)
async def reactivate_subscription(
    current_user = Depends(get_current_user)
):
    """Reactivate a subscription that was set to cancel."""
    service = get_subscription_service()
    user_id = current_user.id
    
    try:
        subscription = service.reactivate_subscription(user_id)
        return SubscriptionResponse(**subscription)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ==================== Payment Methods ====================

@router.get("/setup-intent", response_model=SetupIntentResponse)
async def create_setup_intent(
    current_user = Depends(get_current_user)
):
    """
    Create a Stripe setup intent for collecting payment method.
    Use this before starting a trial to collect card details.
    """
    stripe_service = get_stripe_service()
    sub_service = get_subscription_service()
    user_id = current_user.id
    
    # Check if user already has a subscription with customer ID
    subscription = sub_service.get_by_user_id(user_id)
    
    if subscription and subscription.get("stripe_customer_id"):
        customer_id = subscription["stripe_customer_id"]
    else:
        # Create a new customer
        customer = stripe_service.create_customer(
            email=current_user.email or "",
            user_id=user_id,
            name=None  # CurrentUser doesn't have full_name
        )
        customer_id = customer.id
    
    setup_intent = stripe_service.create_setup_intent(customer_id)
    
    return SetupIntentResponse(client_secret=setup_intent.client_secret)


@router.get("/payment-methods", response_model=list[PaymentMethodResponse])
async def list_payment_methods(
    current_user = Depends(get_current_user)
):
    """List user's saved payment methods."""
    stripe_service = get_stripe_service()
    sub_service = get_subscription_service()
    user_id = current_user.id
    
    subscription = sub_service.get_by_user_id(user_id)
    
    if not subscription or not subscription.get("stripe_customer_id"):
        return []
    
    methods = stripe_service.list_payment_methods(subscription["stripe_customer_id"])
    
    return [
        PaymentMethodResponse(
            id=pm.id,
            brand=pm.card.brand,
            last4=pm.card.last4,
            exp_month=pm.card.exp_month,
            exp_year=pm.card.exp_year
        )
        for pm in methods
    ]


