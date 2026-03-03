"""
Development server runner for DtComb
Run this file from PyCharm to start the server with correct configuration
"""
import uvicorn
from app.config import get_settings

if __name__ == "__main__":
    settings = get_settings()

    print("=" * 60)
    print("🚀 Starting DtComb Development Server")
    print("=" * 60)
    print(f"📍 Host: {settings.HOST}")
    print(f"🔌 Port: {settings.PORT}")
    print(f"🐛 Debug Mode: {settings.DEBUG}")
    print(f"📄 URL: http://localhost:{settings.PORT}")
    print("=" * 60)
    print()

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,  # Always reload in dev mode
        log_level="info"
    )

