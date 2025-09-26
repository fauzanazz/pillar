import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import Response

from app.models.schemas import PdfBuildRequest
from app.services.pdf_service import pdf_service
from app.deps import get_correlation_id, rate_limit

logger = logging.getLogger(__name__)
router = APIRouter(tags=["PDF Generation"])


@router.post(
    "/pdf",
    response_class=Response,
    summary="Generate contract PDF",
    description="Generate a formatted PDF contract document from structured data"
)
async def generate_contract_pdf(
    request: PdfBuildRequest,
    correlation_id: str = Depends(get_correlation_id),
    _: None = Depends(rate_limit)
) -> Response:
    """
    Generate a PDF contract document from structured contract data.
    
    This endpoint:
    1. Takes structured contract data (header, parties, clauses, footer)
    2. Renders HTML template with Indonesian legal formatting
    3. Converts to PDF using WeasyPrint
    4. Returns PDF as downloadable attachment
    
    Args:
        request: PDF build request with contract structure
        correlation_id: Auto-generated correlation ID for request tracing
        
    Returns:
        PDF file as application/pdf with Content-Disposition: attachment
        
    Raises:
        HTTPException: 422 for validation errors, 500 for PDF generation errors
    """
    try:
        logger.info(
            "Starting PDF generation",
            extra={
                "correlation_id": correlation_id,
                "contract_title": request.header.title,
                "parties_count": len(request.parties),
                "clauses_count": len(request.clauses),
                "has_watermark": bool(request.watermark)
            }
        )
        
        pdf_bytes = await pdf_service.generate_contract_pdf(
            request=request,
            correlation_id=correlation_id
        )
        
        safe_title = "".join(c for c in request.header.title if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_title = safe_title.replace(' ', '_')[:50]  # Limit length
        filename = f"kontrak_{safe_title}.pdf"
        
        logger.info(
            "PDF generated successfully",
            extra={
                "correlation_id": correlation_id,
                "pdf_size": len(pdf_bytes),
                "output_filename": filename
            }
        )
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
                "X-Correlation-ID": correlation_id
            }
        )
        
    except ValueError as e:
        logger.error(
            "Validation error in PDF generation",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(
            status_code=422,
            detail={
                "error": {
                    "type": "validation_error",
                    "message": "Invalid PDF request data",
                    "detail": str(e)
                }
            }
        )
        
    except Exception as e:
        logger.error(
            "Unexpected error in PDF generation",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "type": "pdf_generation_error",
                    "message": "Failed to generate PDF document",
                    "detail": str(e)
                }
            }
        )