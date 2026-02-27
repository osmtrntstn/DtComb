# Health Check Endpoint
from fastapi import APIRouter, Response
from app.utils.logger import log_debug
import json

router = APIRouter()


@router.get("/health", tags=["monitoring"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers
    Returns 200 if application is healthy
    """
    log_debug("Health check requested")
    return {
        "status": "healthy",
        "service": "dtcomb-api",
        "version": "1.0.0"
    }


@router.get("/readiness", tags=["monitoring"])
async def readiness_check():
    """
    Readiness check - verifies all dependencies are ready
    """
    checks = {
        "database": True,  # TODO: Add actual DB check
        "r_engine": True,  # TODO: Add R availability check
    }

    all_ready = all(checks.values())
    status_code = 200 if all_ready else 503

    return Response(
        content=json.dumps({
            "ready": all_ready,
            "checks": checks
        }),
        status_code=status_code,
        media_type="application/json"
    )

