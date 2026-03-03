from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.controllers import home_controller, data_upload_controller, analysis_controller,admin_controller,predict_controller,roc_analysis_controller,login_controller, health_controller
from app.handlers.exception_handler import custom_exception_handler
from starlette.middleware.sessions import SessionMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.templating import Jinja2Templates
from app.config import get_settings
from app.utils.logger import log_info
# Optional: Uncomment to enable rate limiting
# from app.middleware.rate_limit import RateLimitMiddleware
# from app.middleware.cors import add_cors_middleware

settings = get_settings()

app = FastAPI(
    title="DtComb API",
    description="ROC Analysis & Biomarker Combination Tool",
    version="1.0.0",
    debug=settings.DEBUG,
    docs_url="/docs" if settings.DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if settings.DEBUG else None
)

# Middleware
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# Optional: Enable rate limiting (uncomment in production)
# app.add_middleware(RateLimitMiddleware, calls=100, period=60)

# Optional: Enable CORS (uncomment if needed)
# add_cors_middleware(app)

# Statik dosyaları (CSS/JS) bağla
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="app/views")

# Controller'ı (Router) dahil et
app.include_router(health_controller.router)  # Health check endpoint
app.include_router(home_controller.router)
app.include_router(data_upload_controller.router)
app.include_router(analysis_controller.router)
app.include_router(admin_controller.router)
app.include_router(predict_controller.router)
app.include_router(roc_analysis_controller.router)
app.include_router(login_controller.router)

app.add_exception_handler(StarletteHTTPException, custom_exception_handler)

@app.on_event("startup")
async def startup_event():
    log_info("🚀 DtComb Application Started")
    log_info(f"📊 Debug Mode: {settings.DEBUG}")
    log_info(f"🔒 Secret Key Configured: {'Yes' if settings.SECRET_KEY else 'No'}")

@app.on_event("shutdown")
async def shutdown_event():
    log_info("🛑 DtComb Application Shutting Down")

if __name__ == "__main__":
    import uvicorn

    settings = get_settings()

    print(f"🚀 Starting server on http://{settings.HOST}:{settings.PORT}")

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,  # 3838
        reload=settings.DEBUG
    )

