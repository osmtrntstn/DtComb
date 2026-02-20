from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.controllers import home_controller, data_upload_controller, analysis_controller, analysis2_controller,admin_controller
from starlette.middleware.sessions import SessionMiddleware

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="session_secret_key")
# Statik dosyaları (CSS/JS) bağla
app.mount("/static", StaticFiles(directory="static"), name="static")

# Controller'ı (Router) dahil et
app.include_router(home_controller.router)
app.include_router(data_upload_controller.router)
app.include_router(analysis_controller.router)
app.include_router(analysis2_controller.router)
app.include_router(admin_controller.router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
