from fastapi import APIRouter, HTTPException, Depends, Header, Request
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.core.rate_limit import limiter
from app.core.auth import get_current_user, CurrentUser
from app.services.analytics_service import AnalyticsService
from app.services.board_service import BoardService
from app.services.pin_service import PinService

router = APIRouter(prefix="/analytics", tags=["analytics"])


def get_analytics_service() -> AnalyticsService:
    return AnalyticsService()


def _ensure_board_in_region(board_id: UUID) -> None:
    """Raise 404 if board is not in current region."""
    if BoardService().get_by_id(board_id) is None:
        raise HTTPException(status_code=404, detail="Board not found")


class ImpressionRequest(BaseModel):
    pin_id: UUID
    board_id: UUID
    session_id: Optional[str] = None


class ClickRequest(BaseModel):
    pin_id: UUID
    board_id: UUID
    click_type: str = "pin"
    session_id: Optional[str] = None


@router.post("/impressions")
@limiter.limit("200/minute")
async def track_impression(
    request: Request,
    body: ImpressionRequest,
    service: AnalyticsService = Depends(get_analytics_service),
    user_agent: Optional[str] = Header(None),
    x_forwarded_for: Optional[str] = Header(None),
    referer: Optional[str] = Header(None),
):
    """Track a pin impression (view)."""
    _ensure_board_in_region(body.board_id)
    ip_address = None
    if x_forwarded_for:
        # Get first IP from X-Forwarded-For header
        ip_address = x_forwarded_for.split(",")[0].strip()
    
    success = service.track_impression(
        pin_id=body.pin_id,
        board_id=body.board_id,
        session_id=body.session_id,
        ip_address=ip_address,
        user_agent=user_agent,
        referrer=referer,
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to track impression")
    
    return {"status": "recorded"}


@router.post("/clicks")
@limiter.limit("200/minute")
async def track_click(
    request: Request,
    body: ClickRequest,
    service: AnalyticsService = Depends(get_analytics_service),
    user_agent: Optional[str] = Header(None),
    x_forwarded_for: Optional[str] = Header(None),
):
    """Track a click/interaction."""
    _ensure_board_in_region(body.board_id)
    if body.click_type not in ["pin", "contact", "website", "map", "share"]:
        raise HTTPException(status_code=400, detail="Invalid click_type")
    
    ip_address = None
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(",")[0].strip()
    
    success = service.track_click(
        pin_id=body.pin_id,
        board_id=body.board_id,
        click_type=body.click_type,
        session_id=body.session_id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to track click")
    
    return {"status": "recorded"}


@router.get("/pins/{pin_id}/stats")
async def get_pin_stats(
    pin_id: UUID,
    days: int = 7,
    current_user: CurrentUser = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    """Get statistics for a pin. Restricted to pin owner or admin."""
    pin = PinService().get_by_id(pin_id)
    if not pin:
        raise HTTPException(status_code=404, detail="Pin not found")
    if current_user.role != "admin" and str(pin.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this pin's stats")
    stats = service.get_pin_stats(pin_id, days=days)
    return stats

