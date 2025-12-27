# Authentication utilities for FastAPI backend
# Extracts and verifies user identity from Supabase JWT tokens

from fastapi import Depends, HTTPException, Header, status
import jwt
from jwt.exceptions import InvalidTokenError
from jwt import PyJWKClient
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
import logging

from app.core.config import settings

# JWKS client for verifying Supabase access tokens (ES256)
# Supabase provides JWKS at: {supabase_url}/auth/v1/.well-known/jwks.json
_jwks_client: Optional[PyJWKClient] = None

def get_jwks_client() -> PyJWKClient:
    """Get the JWKS client for verifying ES256 tokens."""
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client


class CurrentUser(BaseModel):
    """Authenticated user extracted from JWT token."""
    id: UUID
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = "merchant"


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> CurrentUser:
    """
    Extract and verify user from Supabase JWT token.
    
    The JWT is passed in the Authorization header as: Bearer <token>
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Use: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # First, decode the header to check the algorithm
        try:
            unverified_header = jwt.get_unverified_header(token)
            alg = unverified_header.get("alg", "unknown")
        except Exception as e:
            logging.error(f"Could not decode JWT header: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format",
            )
        
        # Supabase access tokens use ES256 (asymmetric), verified via JWKS
        # Service role keys use HS256 (symmetric), verified via JWT secret
        if alg == "ES256":
            # Get the signing key from Supabase's JWKS endpoint
            jwks_client = get_jwks_client()
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                audience="authenticated"
            )
        else:
            # Fallback to HS256 for service role keys
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )
        
        # Extract user metadata from JWT
        user_metadata = payload.get("user_metadata", {})
        app_metadata = payload.get("app_metadata", {})
        
        return CurrentUser(
            id=UUID(user_id),
            email=payload.get("email"),
            phone=payload.get("phone"),
            role=app_metadata.get("role", user_metadata.get("role", "merchant")),
        )
        
    except InvalidTokenError as e:
        # Log the error for debugging
        logging.error(f"JWT decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_optional(
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> Optional[CurrentUser]:
    """
    Optional version of get_current_user.
    Returns None if no authorization header is provided, instead of raising an error.
    Useful for endpoints that work differently for authenticated vs anonymous users.
    """
    if not authorization:
        return None
    
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None


async def require_admin(
    current_user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """
    Dependency that requires the current user to have admin role.
    Use this for admin-only endpoints.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

