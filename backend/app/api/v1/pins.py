from fastapi import APIRouter, HTTPException, Depends, Query, Header, Request
from typing import List, Optional
from uuid import UUID
from app.services.pin_service import PinService
from app.services.rotation_service import get_rotation_service, RotationService
from app.models.pin import Pin, PinCreate, PinUpdate, PinWithSlot
from app.core.auth import get_current_user, get_current_user_optional, CurrentUser

router = APIRouter(prefix="/pins", tags=["pins"])


def get_pin_service() -> PinService:
    return PinService()


@router.get("", response_model=List[Pin])
async def list_pins(
    board_id: Optional[UUID] = Query(None, description="Filter by board ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    service: PinService = Depends(get_pin_service)
):
    """Get all pins, optionally filtered by board and status."""
    return service.get_all(board_id=board_id, status=status)


@router.get("/board/{board_id}/grid", response_model=List[PinWithSlot])
async def get_board_grid(
    board_id: UUID,
    service: PinService = Depends(get_pin_service)
):
    """Get pins for a board grid with slot positions."""
    return service.get_for_board_grid(board_id)


@router.get("/board/{board_id}/rotated")
async def get_rotated_pins(
    board_id: UUID,
    request: Request,
    session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    limit: int = Query(50, ge=1, le=100)
):
    """
    Get pins for a board with fair rotation algorithm.
    Pass X-Session-ID header for personalized rotation.
    Featured pins appear in positions 1-4.
    """
    rotation_service = get_rotation_service()
    return rotation_service.get_rotated_pins(
        board_id=board_id,
        session_id=session_id,
        limit=limit
    )


@router.get("/{pin_id}", response_model=Pin)
async def get_pin(
    pin_id: UUID,
    service: PinService = Depends(get_pin_service)
):
    """Get pin by ID."""
    pin = service.get_by_id(pin_id)
    if not pin:
        raise HTTPException(status_code=404, detail="Pin not found")
    return pin


@router.post("", response_model=Pin, status_code=201)
async def create_pin(
    pin: PinCreate,
    current_user: CurrentUser = Depends(get_current_user),
    service: PinService = Depends(get_pin_service)
):
    """Create a new pin. Requires authentication."""
    return service.create(pin, current_user.id)


@router.patch("/{pin_id}", response_model=Pin)
async def update_pin(
    pin_id: UUID,
    pin_update: PinUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    service: PinService = Depends(get_pin_service)
):
    """Update a pin. Must be the owner or admin."""
    # Admins can update any pin
    user_id = None if current_user.role == "admin" else current_user.id
    pin = service.update(pin_id, pin_update, user_id)
    if not pin:
        raise HTTPException(status_code=404, detail="Pin not found or unauthorized")
    return pin


@router.delete("/{pin_id}", status_code=204)
async def delete_pin(
    pin_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    service: PinService = Depends(get_pin_service)
):
    """Delete a pin. Must be the owner or admin."""
    # Admins can delete any pin
    user_id = None if current_user.role == "admin" else current_user.id
    success = service.delete(pin_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pin not found or unauthorized")
