# CORS Configuration Middleware
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings

settings = get_settings()


def add_cors_middleware(app):
    """
    Add CORS middleware to FastAPI app
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )
    return app

