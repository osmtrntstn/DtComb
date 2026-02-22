from typing import Dict, Any

from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from starlette.responses import HTMLResponse

from app.engines import r_prediction_engine

router = APIRouter()
templates = Jinja2Templates(directory="app/views")

@router.get("/predict", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("predict.html", {"request": request, "title": "Hoş Geldiniz"})
@router.post("/predict-data")
async def run_analysis(data: Dict[str, Any]):
    if not data:
        return {"status": "error", "message": "Veri boş geldi!"}
    return r_prediction_engine.call_prediction(data)
