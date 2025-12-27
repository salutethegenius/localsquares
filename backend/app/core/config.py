from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional, Union


class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str  # JWT secret for verifying auth tokens
    
    # Application Configuration
    app_name: str = "LocalSquares API"
    app_version: str = "0.1.0"
    debug: bool = False
    
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

