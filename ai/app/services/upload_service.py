import logging
import httpx
from typing import Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class UploadService:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def upload_pdf_to_presigned_url(
        self, 
        pdf_bytes: bytes, 
        presigned_url: str,
        correlation_id: Optional[str] = None
    ) -> str:
        """
        Upload PDF bytes to a presigned URL.
        
        Args:
            pdf_bytes: PDF file content as bytes
            presigned_url: Presigned URL for upload
            correlation_id: Request correlation ID for logging
            
        Returns:
            The public URL of the uploaded file
            
        Raises:
            Exception: If upload fails
        """
        try:
            logger.info(
                "Starting PDF upload to presigned URL",
                extra={
                    "correlation_id": correlation_id,
                    "pdf_size_bytes": len(pdf_bytes),
                    "url_domain": urlparse(presigned_url).netloc
                }
            )
            
            # Upload file to presigned URL
            response = await self.client.put(
                presigned_url,
                content=pdf_bytes,
                headers={
                    "Content-Type": "application/pdf",
                }
            )
            
            if response.status_code not in [200, 204]:
                raise Exception(
                    f"Upload failed with status {response.status_code}: {response.text}"
                )
            
            # Extract the public URL (remove query parameters from presigned URL)
            parsed_url = urlparse(presigned_url)
            public_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
            
            logger.info(
                "PDF uploaded successfully to presigned URL",
                extra={
                    "correlation_id": correlation_id,
                    "public_url": public_url,
                    "response_status": response.status_code
                }
            )
            
            return public_url
            
        except httpx.TimeoutException as e:
            logger.error(
                "Timeout while uploading PDF",
                extra={"correlation_id": correlation_id, "error": str(e)}
            )
            raise Exception(f"Upload timeout: {str(e)}")
        
        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error while uploading PDF",
                extra={
                    "correlation_id": correlation_id, 
                    "status_code": e.response.status_code,
                    "error": str(e)
                }
            )
            raise Exception(f"Upload failed: HTTP {e.response.status_code}")
        
        except Exception as e:
            logger.error(
                "Unexpected error while uploading PDF",
                extra={"correlation_id": correlation_id, "error": str(e)}
            )
            raise Exception(f"Upload failed: {str(e)}")
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


# Global upload service instance
upload_service = UploadService()