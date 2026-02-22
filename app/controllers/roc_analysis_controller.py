from typing import Dict, Any

from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

from app.services import roc_analysis_service

router = APIRouter()
templates = Jinja2Templates(directory="app/views")


@router.get("/roc-analysis")
async def index(request: Request):
    return templates.TemplateResponse("roc-analysis.html", {"request": request, "title": "Hoş Geldiniz"})


@router.post("/run-roc-analysis")
async def run_analysis(data: Dict[str, Any]):
    return await roc_analysis_service.run_analysis(data)
