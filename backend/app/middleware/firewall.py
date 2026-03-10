from typing import Iterable, Optional

from fastapi import status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

from app.core.config import settings


BAD_UA_SUBSTRINGS: Iterable[str] = (
    "sqlmap",
    "nikto",
    "nmap",
    "masscan",
    "zgrab",
    "acunetix",
    "nessus",
)

SUSPICIOUS_PATH_SEGMENTS: Iterable[str] = (
    "/.git",
    "/.env",
    "/wp-admin",
    "/wp-login",
    "/phpmyadmin",
    "/admin.php",
)


def _get_client_ip(request: Request) -> str:
    # Prefer Cloudflare's connecting IP when present
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()

    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()

    if request.client:
        return request.client.host

    return "unknown"


def _is_blocked_ip(ip: str) -> bool:
    blocked_raw: Optional[str] = getattr(settings, "blocked_ips", None)
    if not blocked_raw:
        return False
    blocked = [item.strip() for item in blocked_raw.split(",") if item.strip()]
    return ip in blocked


class FirewallMiddleware(BaseHTTPMiddleware):
    """
    Lightweight application-level firewall.

    - Blocks known-bad User-Agents (common scanners)
    - Blocks clearly suspicious paths (probing for other apps)
    - Enforces a maximum request body size
    - Supports manual IP blocklist via env
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        user_agent = request.headers.get("User-Agent", "") or ""
        client_ip = _get_client_ip(request)

        # Optionally require that all traffic comes through Cloudflare
        if settings.require_cloudflare_proxy:
            if not request.headers.get("CF-Connecting-IP"):
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "Direct access not allowed"},
                )

        # IP blocklist
        if _is_blocked_ip(client_ip):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Forbidden"},
            )

        # Obvious path probes
        if any(segment in path for segment in SUSPICIOUS_PATH_SEGMENTS):
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Not found"},
            )

        # Known-bad scanners in User-Agent
        ua_lower = user_agent.lower()
        if any(bad in ua_lower for bad in BAD_UA_SUBSTRINGS):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Forbidden"},
            )

        # Basic body size enforcement
        max_body = getattr(settings, "max_request_body_size", None)
        if max_body and request.method in {"POST", "PUT", "PATCH"}:
            body = await request.body()
            if len(body) > max_body:
                return JSONResponse(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    content={"detail": "Request body too large"},
                )

        return await call_next(request)

