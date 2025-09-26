import uuid
import time
import logging
from typing import Dict, Optional
from collections import defaultdict, deque

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer

logger = logging.getLogger(__name__)

# Simple in-memory rate limiter (TODO: Replace with Redis for production)
class TokenBucket:
    """Simple token bucket rate limiter."""
    
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.refill_rate = refill_rate 
        self.tokens = capacity
        self.last_refill = time.time()
    
    def consume(self, tokens: int = 1) -> bool:
        """Try to consume tokens from bucket."""
        now = time.time()
        
        time_elapsed = now - self.last_refill
        new_tokens = time_elapsed * self.refill_rate
        self.tokens = min(self.capacity, self.tokens + new_tokens)
        self.last_refill = now
        
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False


# Rate limiter storage (TODO: Replace with Redis)
_rate_limiters: Dict[str, TokenBucket] = defaultdict(
    lambda: TokenBucket(capacity=100, refill_rate=1.67)
)


def get_correlation_id(request: Request) -> str:
    correlation_id = request.headers.get("X-Request-ID") or request.headers.get("X-Correlation-ID")
    
    if not correlation_id:
        correlation_id = str(uuid.uuid4())
    
    request.state.correlation_id = correlation_id
    
    return correlation_id


async def rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    bucket = _rate_limiters[client_ip]
    
    if not bucket.consume():
        logger.warning(
            "Rate limit exceeded",
            extra={
                "client_ip": client_ip,
                "correlation_id": getattr(request.state, "correlation_id", None)
            }
        )
        raise HTTPException(
            status_code=429,
            detail={
                "error": {
                    "type": "rate_limit_exceeded",
                    "message": "Too many requests. Please try again later.",
                    "detail": "Rate limit: 100 requests per minute"
                }
            }
        )
    
    return None


bearer_scheme = HTTPBearer(auto_error=False)


async def get_api_key(token: Optional[str] = Depends(bearer_scheme)) -> Optional[str]:
    if token:
        return token.credentials
    return None


# TODO: Implement Redis-based rate limiting
# Example Redis rate limiter:
#
# import redis
# from datetime import datetime, timedelta
#
# redis_client = redis.Redis(host='localhost', port=6379, db=0)
#
# async def redis_rate_limit(request: Request, limit: int = 100, window: int = 60):
#     """Redis-based sliding window rate limiter."""
#     client_ip = request.client.host
#     key = f"rate_limit:{client_ip}"
#     
#     now = datetime.utcnow()
#     window_start = now - timedelta(seconds=window)
#     
#     # Use Redis sorted set for sliding window
#     pipe = redis_client.pipeline()
#     pipe.zremrangebyscore(key, 0, window_start.timestamp())
#     pipe.zadd(key, {str(uuid.uuid4()): now.timestamp()})
#     pipe.zcard(key)
#     pipe.expire(key, window)
#     results = pipe.execute()
#     
#     request_count = results[2]
#     
#     if request_count > limit:
#         raise HTTPException(status_code=429, detail="Rate limit exceeded")