from fastapi import APIRouter
from app.api.v1 import boards, pins, analytics, subscriptions, webhooks, featured, ai

api_router = APIRouter()

api_router.include_router(boards.router)
api_router.include_router(pins.router)
api_router.include_router(analytics.router)
api_router.include_router(subscriptions.router)
api_router.include_router(webhooks.router)
api_router.include_router(featured.router)
api_router.include_router(ai.router)

