from fastapi import APIRouter, HTTPException, Depends, Header, Request
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


def get_analytics_service() -> AnalyticsService:
    return AnalyticsService()


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
async def track_impression(
    request: ImpressionRequest,
    service: AnalyticsService = Depends(get_analytics_service),
    user_agent: Optional[str] = Header(None),
    x_forwarded_for: Optional[str] = Header(None),
    referer: Optional[str] = Header(None),
):
    """Track a pin impression (view)."""
    ip_address = None
    if x_forwarded_for:
        # Get first IP from X-Forwarded-For header
        ip_address = x_forwarded_for.split(",")[0].strip()
    
    success = service.track_impression(
        pin_id=request.pin_id,
        board_id=request.board_id,
        session_id=request.session_id,
        ip_address=ip_address,
        user_agent=user_agent,
        referrer=referer,
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to track impression")
    
    return {"status": "recorded"}


@router.post("/clicks")
async def track_click(
    request: ClickRequest,
    service: AnalyticsService = Depends(get_analytics_service),
    user_agent: Optional[str] = Header(None),
    x_forwarded_for: Optional[str] = Header(None),
):
    """Track a click/interaction."""
    if request.click_type not in ["pin", "contact", "website", "map", "share"]:
        raise HTTPException(status_code=400, detail="Invalid click_type")
    
    ip_address = None
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(",")[0].strip()
    
    success = service.track_click(
        pin_id=request.pin_id,
        board_id=request.board_id,
        click_type=request.click_type,
        session_id=request.session_id,
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
    service: AnalyticsService = Depends(get_analytics_service),
):
    """Get statistics for a pin."""
    # TODO: Add authentication check - only pin owner or admin can view stats
    stats = service.get_pin_stats(pin_id, days=days)
    return stats

