from typing import Dict, Any

from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from celery.result import AsyncResult

from app.services import roc_analysis_service
from app.tasks import run_roc_analysis_task


router = APIRouter()
templates = Jinja2Templates(directory="app/views")


@router.get("/roc-analysis")
async def index(request: Request):
    return templates.TemplateResponse("roc-analysis.html", {"request": request, "title": "Hoş Geldiniz", "url_for": request.url_for})


@router.post("/run-roc-analysis")
async def run_analysis(data: Dict[str, Any]):
    # Trigger Celery task
    task = run_roc_analysis_task.delay(data)
    return {"task_id": task.id, "status": "processing"}

@router.get("/roc-analysis-status/{task_id}")
async def get_analysis_status(task_id: str):
    task_result = AsyncResult(task_id)
    if task_result.state == 'PENDING':
        return {"state": "PENDING", "status": "Pending..."}
    elif task_result.state != 'FAILURE':
        if task_result.ready():
            return {
                "state": "SUCCESS",
                "result": task_result.result
            }
        else:
             return {"state": "PROCESSING", "status": "Processing..."}
    else:
        return {
            "state": "FAILURE",
            "status": str(task_result.info),
        }
