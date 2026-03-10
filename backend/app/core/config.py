from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional, Union, List


class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str  # JWT secret for verifying auth tokens
    
    # Application Configuration
    app_name: str = "LocalSquares API"
    app_version: str = "0.1.0"
    debug: bool = False
    
    # Region scope (e.g. freeport = only Grand Bahama/Freeport boards; unset = all islands)
    region_scope: Optional[str] = "freeport"
    current_island_slug: str = "grand-bahama"  # Island slug for filtering when region_scope is set

    @property
    def allowed_island_slugs(self) -> List[str]:
        """When region_scope is 'freeport', only Grand Bahama boards are visible."""
        if self.region_scope == "freeport":
            return [self.current_island_slug]
        return []  # empty = no filter (all islands)

    # CORS Configuration (can be comma-separated string or JSON array)
    cors_origins: Union[str, list[str]] = "http://localhost:3000,http://localhost:3001"
    
    # Cloudflare Images (optional, for future use)
    cloudflare_account_id: Optional[str] = None
    cloudflare_api_token: Optional[str] = None
    
    # Stripe Configuration
    stripe_secret_key: Optional[str] = None
    stripe_publishable_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    stripe_price_trial: str = "price_trial"  # $1 trial price ID
    stripe_price_monthly: str = "price_monthly"  # $14/month price ID
    stripe_price_annual: str = "price_annual"  # $120/year price ID
    
    # Email Configuration (Resend)
    resend_api_key: Optional[str] = None
    email_from: str = "LocalSquares <noreply@localsquares.com>"
    
    # Environment
    environment: str = "development"
    # HSTS max-age in seconds (set in production; 0 disables)
    hsts_max_age: int = 31536000  # 1 year when enabled
    
    # Rate limiting / storage (optional Redis backing store)
    redis_url: Optional[str] = None
    
    # Firewall configuration
    blocked_ips: Optional[str] = None  # Comma-separated list of blocked IPs
    max_request_body_size: Optional[int] = 10 * 1024 * 1024  # 10MB default
    
    # Proxy / edge network configuration
    require_cloudflare_proxy: bool = False
    trusted_proxies: Optional[str] = None  # Comma-separated list/ranges of trusted proxy IPs
    
    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from comma-separated string."""
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return ["http://localhost:3000", "http://localhost:3001"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

