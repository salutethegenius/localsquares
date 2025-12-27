from typing import Optional
import httpx
from app.core.config import settings


class ImageService:
    """Service for image processing and optimization via Cloudflare Images."""
    
    def __init__(self):
        self.cloudflare_account_id = settings.cloudflare_account_id
        self.cloudflare_api_token = settings.cloudflare_api_token
        self.cloudflare_base_url = (
            f"https://api.cloudflare.com/client/v4/accounts/{self.cloudflare_account_id}/images/v1"
            if self.cloudflare_account_id
            else None
        )
    
    def is_configured(self) -> bool:
        """Check if Cloudflare Images is configured."""
        return bool(self.cloudflare_account_id and self.cloudflare_api_token)
    
    def upload_to_cloudflare(
        self,
        image_url: str,
        filename: Optional[str] = None,
    ) -> Optional[dict]:
        """
        Upload an image to Cloudflare Images from a URL.
        Returns the Cloudflare image metadata.
        """
        if not self.is_configured():
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.cloudflare_base_url}",
                    headers={
                        "Authorization": f"Bearer {self.cloudflare_api_token}",
                    },
                    data={
                        "url": image_url,
                        "filename": filename or "pin-image",
                    },
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Error uploading to Cloudflare Images: {e}")
            return None
    
    def get_image_url(
        self,
        cloudflare_image_id: str,
        variant: str = "public",
    ) -> str:
        """
        Get the CDN URL for a Cloudflare Images image.
        Variants: public, thumbnail, etc.
        """
        if not self.cloudflare_account_id:
            return ""
        
        return f"https://imagedelivery.net/{self.cloudflare_account_id}/{cloudflare_image_id}/{variant}"
    
    def generate_variant_url(
        self,
        supabase_url: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        fit: str = "cover",
    ) -> str:
        """
        Generate an optimized image URL.
        For now, returns the Supabase URL.
        In production, this would use Cloudflare Images variants.
        """
        # TODO: Implement Cloudflare Images variant generation
        # This would require uploading the image first, then serving variants
        return supabase_url

