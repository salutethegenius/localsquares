"""
Stripe Webhook Handler for LocalSquares.
Handles payment events from Stripe.
"""
from fastapi import APIRouter, Request, HTTPException, status, Header
import stripe

from app.services.stripe_service import get_stripe_service
from app.services.subscription_service import get_subscription_service

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature")
):
    """
    Handle Stripe webhook events.
    
    Supported events:
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.payment_succeeded
    - invoice.payment_failed
    - payment_intent.succeeded (for featured bookings)
    """
    if not stripe_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe-Signature header"
        )
    
    payload = await request.body()
    stripe_service = get_stripe_service()
    
    try:
        event = stripe_service.construct_webhook_event(payload, stripe_signature)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    sub_service = get_subscription_service()
    
    # Handle subscription events
    if event.type == "customer.subscription.updated":
        subscription = event.data.object
        sub_service.handle_subscription_updated(subscription)
        return {"status": "handled", "event": "subscription.updated"}
    
    elif event.type == "customer.subscription.deleted":
        subscription = event.data.object
        sub_service.handle_subscription_deleted(subscription)
        return {"status": "handled", "event": "subscription.deleted"}
    
    # Handle invoice events
    elif event.type == "invoice.payment_succeeded":
        invoice = event.data.object
        # Log successful payment (could trigger email)
        return {"status": "handled", "event": "invoice.payment_succeeded"}
    
    elif event.type == "invoice.payment_failed":
        invoice = event.data.object
        sub_service.handle_payment_failed(invoice)
        return {"status": "handled", "event": "invoice.payment_failed"}
    
    # Handle payment intent events (for one-time payments like featured spots)
    elif event.type == "payment_intent.succeeded":
        payment_intent = event.data.object
        metadata = payment_intent.metadata
        
        # Check if this is a featured booking payment
        if metadata.get("type") == "featured":
            # Update featured booking status
            from app.core.database import get_supabase_client
            supabase = get_supabase_client()
            
            supabase.table("featured_bookings").update({
                "payment_status": "paid"
            }).eq(
                "stripe_payment_intent_id", payment_intent.id
            ).execute()
            
            return {"status": "handled", "event": "featured_payment"}
        
        return {"status": "handled", "event": "payment_intent.succeeded"}
    
    elif event.type == "payment_intent.payment_failed":
        payment_intent = event.data.object
        metadata = payment_intent.metadata
        
        if metadata.get("type") == "featured":
            from app.core.database import get_supabase_client
            supabase = get_supabase_client()
            
            supabase.table("featured_bookings").update({
                "payment_status": "failed"
            }).eq(
                "stripe_payment_intent_id", payment_intent.id
            ).execute()
        
        return {"status": "handled", "event": "payment_intent.failed"}
    
    # Unhandled event type
    return {"status": "ignored", "event": event.type}


