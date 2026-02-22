from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from app.controllers import home_controller, data_upload_controller, analysis_controller,admin_controller,predict_controller,roc_analysis_controller
from app.controllers.exception_handler_controller import custom_404_handler
from starlette.middleware.sessions import SessionMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.templating import Jinja2Templates

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="session_secret_key")
# Statik dosyaları (CSS/JS) bağla
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="app/views")

# Controller'ı (Router) dahil et
app.include_router(home_controller.router)
app.include_router(data_upload_controller.router)
app.include_router(analysis_controller.router)
app.include_router(admin_controller.router)
# app.include_router(predict_controller.router)
app.include_router(roc_analysis_controller.router)

app.add_exception_handler(StarletteHTTPException, custom_404_handler)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
