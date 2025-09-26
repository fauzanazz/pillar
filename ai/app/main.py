import logging
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.settings import settings
from app.models.schemas import HealthResponse, ErrorResponse
from app.routers import drafting, pdf, workflow

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s", "correlation_id": "%(correlation_id)s"}',
    datefmt='%Y-%m-%dT%H:%M:%S'
)

class CorrelationIdFilter(logging.Filter):
    def filter(self, record):
        if not hasattr(record, 'correlation_id'):
            record.correlation_id = 'unknown'
        return True

logging.getLogger().addFilter(CorrelationIdFilter())
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Contract Management Service")
    
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is required")
    
    logger.info(
        "Service configuration loaded",
        extra={
            "model_name": settings.openai_model,
            "cors_origins": settings.cors_origins,
            "log_level": settings.log_level
        }
    )
    
    yield
    
    logger.info("Shutting down AI Contract Management Service")


app = FastAPI(
    title="AI Contract Management Service",
    description="Microservice for AI-powered contract drafting and PDF generation for PT ILCS",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start_time = time.time()
    
    correlation_id = request.headers.get("X-Request-ID") or request.headers.get("X-Correlation-ID")
    if not correlation_id:
        correlation_id = str(uuid.uuid4())
    
    request.state.correlation_id = correlation_id
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(
        "HTTP request processed",
        extra={
            "correlation_id": correlation_id,
            "method": request.method,
            "url": str(request.url),
            "status_code": response.status_code,
            "process_time_seconds": round(process_time, 4),
            "client_ip": request.client.host if request.client else "unknown"
        }
    )
    
    response.headers["X-Correlation-ID"] = correlation_id
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    correlation_id = getattr(request.state, 'correlation_id', 'unknown')
    
    logger.error(
        "HTTP exception occurred",
        extra={
            "correlation_id": correlation_id,
            "status_code": exc.status_code,
            "detail": exc.detail
        }
    )
    
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        error_detail = exc.detail
    else:
        error_detail = {
            "error": {
                "type": "http_error",
                "message": str(exc.detail),
                "status_code": exc.status_code
            }
        }
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_detail,
        headers={"X-Correlation-ID": correlation_id}
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    correlation_id = getattr(request.state, 'correlation_id', 'unknown')
    
    logger.error(
        "Validation error occurred",
        extra={
            "correlation_id": correlation_id,
            "errors": exc.errors()
        }
    )
    
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "type": "validation_error",
                "message": "Request validation failed",
                "detail": exc.errors()
            }
        },
        headers={"X-Correlation-ID": correlation_id}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    correlation_id = getattr(request.state, 'correlation_id', 'unknown')
    
    logger.error(
        "Unexpected error occurred",
        extra={
            "correlation_id": correlation_id,
            "error_type": type(exc).__name__,
            "error_message": str(exc)
        },
        exc_info=True
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "type": "internal_error",
                "message": "An unexpected error occurred",
                "detail": "Please check the logs for more details"
            }
        },
        headers={"X-Correlation-ID": correlation_id}
    )


@app.get(
    "/healthz",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health check",
    description="Check if the service is healthy and ready to accept requests"
)
async def health_check():
    return HealthResponse(ok=True)


app.include_router(drafting.router, prefix="/ai")
app.include_router(pdf.router, prefix="/ai")
app.include_router(workflow.router, prefix="/api/v1")


@app.get(
    "/",
    summary="Service information",
    description="Get basic information about the AI Contract Management Service"
)
async def root():
    return {
        "service": "AI Contract Management Service",
        "version": "1.0.0",
        "description": "Microservice for AI-powered contract drafting and PDF generation",
        "endpoints": {
            "draft": "/ai/draft",
            "pdf": "/ai/pdf",
            "workflow": "/api/v1",
            "health": "/healthz",
            "docs": "/docs"
        },
        "status": "operational"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8081,
        reload=False,
        log_config=None  
    )