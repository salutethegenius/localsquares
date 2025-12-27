"""
Featured Booking API endpoints for LocalSquares.
Handles featured spot bookings.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID
from datetime import date

from app.core.auth import get_current_user
from app.services.featured_service import get_featured_service, FeaturedService
from app.models.subscription import (
    FeaturedBookingCreate,
    FeaturedBookingResponse,
    FeaturedAvailability
)

router = APIRouter(prefix="/featured", tags=["featured"])


# ==================== Availability ====================

@router.get("/availability/{board_id}", response_model=List[FeaturedAvailability])
async def get_availability(
    board_id: UUID,
    days: int = Query(14, ge=1, le=30),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Get featured spot availability for a board."""
    service = get_featured_service()
    user_id = UUID(current_user["id"]) if current_user else None
    
    return service.get_availability(
        board_id=board_id,
        user_id=user_id,
        days=days
    )


@router.get("/check/{board_id}/{featured_date}")
async def check_date_availability(
    board_id: UUID,
    featured_date: str
):
    """Check if a specific date is available."""
    service = get_featured_service()
    
    try:
        dt = date.fromisoformat(featured_date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    is_available = service.is_date_available(board_id, dt)
    
    return {
        "date": featured_date,
        "board_id": str(board_id),
        "is_available": is_available
    }


# ==================== Booking ====================

@router.post("/book", status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: FeaturedBookingCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Book a featured spot.
    
    Returns booking with client_secret for payment confirmation.
    Requires active subscription.
    """
    service = get_featured_service()
    user_id = UUID(current_user["id"])
    
    try:
        featured_date = date.fromisoformat(data.featured_date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    try:
        booking = service.create_booking(
            pin_id=data.pin_id,
            board_id=data.board_id,
            user_id=user_id,
            featured_date=featured_date,
            payment_method_id=data.payment_method_id
        )
        return booking
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/confirm/{booking_id}", response_model=FeaturedBookingResponse)
async def confirm_booking(
    booking_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Confirm a booking after payment."""
    service = get_featured_service()
    
    booking = service.confirm_booking(booking_id)
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    return FeaturedBookingResponse(**booking)


# ==================== User Bookings ====================

@router.get("/my-bookings", response_model=List[FeaturedBookingResponse])
async def get_my_bookings(
    include_past: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    """Get current user's featured bookings."""
    service = get_featured_service()
    user_id = UUID(current_user["id"])
    
    bookings = service.get_user_bookings(user_id, include_past=include_past)
    
    return [FeaturedBookingResponse(**b) for b in bookings]


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking(
    booking_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a featured booking."""
    service = get_featured_service()
    user_id = UUID(current_user["id"])
    
    success = service.cancel_booking(booking_id, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found or cannot be canceled"
        )


# ==================== Board Featured ====================

@router.get("/today/{board_id}")
async def get_today_featured(board_id: UUID):
    """Get today's featured pin for a board."""
    service = get_featured_service()
    
    featured = service.get_today_featured_pin(board_id)
    
    return {
        "board_id": str(board_id),
        "has_featured": featured is not None,
        "pin": featured
    }


