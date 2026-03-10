import secrets
from typing import Optional

from fastapi import status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

from app.core.config import settings


CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"


def _generate_csrf_token() -> str:
  return secrets.token_urlsafe(32)


class CSRFMiddleware(BaseHTTPMiddleware):
  """
  Double-submit cookie CSRF protection.

  - On GET/HEAD/OPTIONS: ensures a CSRF cookie exists.
  - On state-changing requests (POST/PUT/PATCH/DELETE): requires matching X-CSRF-Token header.
  - Stripe webhook endpoint is exempt (uses its own signature).
  """

  async def dispatch(self, request: Request, call_next) -> Response:
    # Exempt Stripe webhook (and potentially other non-browser endpoints)
    if request.url.path.startswith("/api/v1/webhooks/stripe"):
      return await call_next(request)

    method = request.method.upper()

    # For safe methods, just ensure cookie exists
    if method in {"GET", "HEAD", "OPTIONS"}:
      response = await call_next(request)
      if CSRF_COOKIE_NAME not in request.cookies:
        token = _generate_csrf_token()
        response.set_cookie(
          CSRF_COOKIE_NAME,
          token,
          secure=True,
          httponly=False,
          samesite="strict",
        )
      return response

    # For unsafe methods, validate header vs cookie
    cookie_token: Optional[str] = request.cookies.get(CSRF_COOKIE_NAME)
    header_token: Optional[str] = request.headers.get(CSRF_HEADER_NAME)

    if not cookie_token or not header_token or cookie_token != header_token:
      return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": "CSRF validation failed"},
      )

    return await call_next(request)

