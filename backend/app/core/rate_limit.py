"""Rate limiting for API endpoints.

Configured to support:
- per-user limits when an Authorization header is present
- per-IP limits as a fallback
- optional Redis backing store for distributed rate limiting
- a global default limit applied across all routes
"""
from slowapi import Limiter
from starlette.requests import Request

from app.core.config import settings


def _get_real_ip(request: Request) -> str:
    """
    Extract the real client IP, taking into account trusted proxies and Cloudflare.
    """
    # Cloudflare passes original IP in CF-Connecting-IP
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()

    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()

    if request.client:
        return request.client.host

    return "unknown"


def rate_limit_key(request: Request) -> str:
    """
    Composite key for rate limiting.

    - If Authorization header with Bearer token is present, use it as the key (per-user limiting).
    - Otherwise, fall back to the client IP (per-IP limiting).
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # Use the raw token string as the key; we don't need to decode it for rate limiting purposes.
        return auth_header.replace("Bearer ", "", 1)
    return _get_real_ip(request)


storage_uri = settings.redis_url or "memory://"

limiter = Limiter(
    key_func=rate_limit_key,
    default_limits=["300/minute"],  # Global safety net per key
    storage_uri=storage_uri,
)
