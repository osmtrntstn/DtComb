# API Rate Limiting Middleware
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from time import time
from collections import defaultdict
from typing import Dict
from app.utils.logger import log_warning


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple rate limiting middleware
    Tracks requests per IP address
    """

    def __init__(self, app, calls: int = 100, period: int = 60):
        """
        Args:
            app: FastAPI application
            calls: Maximum number of calls allowed
            period: Time period in seconds
        """
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.clients: Dict[str, list] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host

        # Skip rate limiting for localhost in development
        if client_ip in ["127.0.0.1", "localhost", "::1"]:
            return await call_next(request)

        # Clean old entries
        current_time = time()
        self.clients[client_ip] = [
            req_time for req_time in self.clients[client_ip]
            if current_time - req_time < self.period
        ]

        # Check rate limit
        if len(self.clients[client_ip]) >= self.calls:
            log_warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Maximum {self.calls} requests per {self.period} seconds."
            )

        # Add current request
        self.clients[client_ip].append(current_time)

        # Process request
        response = await call_next(request)
        return response

