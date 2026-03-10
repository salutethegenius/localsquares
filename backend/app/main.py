from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.rate_limit import limiter
from app.middleware.firewall import FirewallMiddleware
from app.middleware.csrf import CSRFMiddleware
from app.api.v1 import api_router

# Allowed CORS methods and headers (explicit list to reduce surface)
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
CORS_ALLOW_HEADERS = [
    "Authorization",
    "Content-Type",
    "Accept",
    "Origin",
    "X-Session-ID",
    "Stripe-Signature",
    "X-CSRF-Token",
]


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security-related HTTP headers to all responses."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        # Modern best practice: disable old XSS auditor and rely on CSP
        response.headers["X-XSS-Protection"] = "0"
        if settings.environment == "production" and getattr(settings, "hsts_max_age", 0) > 0:
            response.headers["Strict-Transport-Security"] = (
                f"max-age={settings.hsts_max_age}; includeSubDomains"
            )
        return response


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

# Firewall should be early in the chain
app.add_middleware(FirewallMiddleware)

# CSRF protection for browser-originating state-changing requests
app.add_middleware(CSRFMiddleware)

# Rate limiting (enabled in all environments; use higher env thresholds in dev via env config)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Security headers (before CORS so they apply to all responses)
app.add_middleware(SecurityHeadersMiddleware)

# CORS middleware
if settings.environment == "production":
    # In production, lock CORS to the public frontend domains
    allow_origins = [
        "https://freeportsquares.com",
        "https://www.freeportsquares.com",
    ]
else:
    allow_origins = settings.cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=CORS_ALLOW_METHODS,
    allow_headers=CORS_ALLOW_HEADERS,
)

# Include API routers
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """API root; minimal info in production."""
    payload = {"status": "running"}
    if settings.debug:
        payload["message"] = settings.app_name
        payload["version"] = settings.app_version
    return payload


@app.get("/health")
async def health():
    return {"status": "healthy"}

