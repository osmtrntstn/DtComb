from typing import Dict, Any

from fastapi import APIRouter, Request, Form, HTTPException
from fastapi.templating import Jinja2Templates
from app.db import database

from app.services import r_analysis_engine

router = APIRouter()
templates = Jinja2Templates(directory="app/views")


@router.get("/analysis")
async def index(request: Request):
    functions = database.get_functions()
    methods = database.get_methods(functions[0].Id)  # İlk fonksiyonun id'sine göre yöntemleri al
    return templates.TemplateResponse("analysis.html",
                                      {"request": request, "title": "Hoş Geldiniz",
                                       "functions": functions,
                                       "methods": methods})


@router.post("/run-analysis")
async def run_analysis(data: Dict[str, Any]):
    if not data:
        return {"status": "error", "message": "Veri boş geldi!"}
    return r_analysis_engine.call_roc_plot_analysis(data)


@router.post("/get-function-methods")
async def getFunctionMethods(request: Request, id: str = Form(...)):
    # Yazdığınız fonksiyonu burada kullanın
    methods = database.get_methods(id)  # İlk fonksiyonun id'sine göre yöntemleri al
    # 2. View'a sonuçları gönder
    return methods


@router.post("/get-params")
async def getParameters(request: Request, parentId: str = Form(...)):
    # Yazdığınız fonksiyonu burada kullanın
    function_parameters = database.get_parameters(parentId)  # İlk fonksiyonun id'sine göre yöntemleri al
    # 2. View'a sonuçları gönder
    return function_parameters
