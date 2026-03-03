from typing import Dict, Any

from fastapi import APIRouter, Request, Form
from fastapi.templating import Jinja2Templates
from app.db import database

from app.engines import r_analysis_engine
from app.tasks import run_analysis_task
from celery.result import AsyncResult

router = APIRouter()
templates = Jinja2Templates(directory="app/views")


@router.get("/analysis")
def index(request: Request):
    functions = database.get_functions()
    methods = database.get_methods(functions[0].Id)  # İlk fonksiyonun id'sine göre yöntemleri al
    return templates.TemplateResponse("analysis.html",
                                      {"request": request, "title": "Hoş Geldiniz",
                                       "functions": functions,
                                       "methods": methods,
                                       "url_for": request.url_for})


@router.post("/run-analysis")
def run_analysis(data: Dict[str, Any]):
    if not data:
        return {"status": "error", "message": "Veri boş geldi!"}
    #return r_analysis_engine.call_plot_analysis(data)
    # Trigger Celery task
    task = run_analysis_task.delay(data)
    return {"task_id": task.id, "status": "processing"}


from app.celery_worker import celery  # Kendi oluşturduğun celery instance'ını import et


@router.get("/analysis-status/{task_id}")
def get_analysis_status(task_id: str):
    try:
        # AsyncResult'a 'app' parametresini ekle.
        # Bu, ona "Git ve şu celery ayarlarındaki backend'i kullan" der.
        task_result = AsyncResult(task_id, app=celery)

        if task_result.state == 'PENDING':
            return {"state": task_result.state, "status": "Pending..."}

        elif task_result.state == 'SUCCESS':
            return {
                "state": task_result.state,
                "result": task_result.result
            }

        elif task_result.state == 'FAILURE':
            return {
                "state": task_result.state,
                "status": str(task_result.info)
            }

        else:
            return {"state": task_result.state, "status": "Processing..."}

    except Exception as e:
        return {"state": "error", "status": str(e)}


@router.post("/get-function-methods")
def getFunctionMethods(request: Request, id: str = Form(...)):
    # Yazdığınız fonksiyonu burada kullanın
    methods = database.get_methods(id)  # İlk fonksiyonun id'sine göre yöntemleri al
    # 2. View'a sonuçları gönder
    return methods


@router.post("/get-params")
def getParameters(request: Request, parentId: str = Form(...)):
    # Yazdığınız fonksiyonu burada kullanın
    function_parameters = database.get_parameters(parentId)  # İlk fonksiyonun id'sine göre yöntemleri al
    # 2. View'a sonuçları gönder
    return function_parameters
