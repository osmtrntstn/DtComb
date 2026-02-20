import json
from typing import Optional

from fastapi import APIRouter, Request, Form
from fastapi.templating import Jinja2Templates
from numpy import integer

from app.db.database import get_functions, get_methods, get_function_parameters, get_method_parameters

router = APIRouter()
templates = Jinja2Templates(directory="app/views")


@router.get("/analysis")
async def index(request: Request):
    functions = get_functions()
    methods = get_methods(functions[0].Id)  # İlk fonksiyonun id'sine göre yöntemleri al
    methods2 = get_method_parameters(method_id=99)  # İlk fonksiyonun id'sine göre yöntemleri al
    methods3 = get_method_parameters(method_parameter_id=33)  # İlk fonksiyonun id'sine göre yöntemleri al
    return templates.TemplateResponse("analysis.html",
                                      {"request": request, "title": "Hoş Geldiniz",
                                       "functions": functions,
                                       "methods": methods})


@router.post("/get-methods")
async def analyze(request: Request, id: int = Form(...)):
    # Yazdığınız fonksiyonu burada kullanın
    methods = get_methods(id)  # İlk fonksiyonun id'sine göre yöntemleri al
    # 2. View'a sonuçları gönder
    return methods


@router.post("/get-functions-params")
async def analyze(request: Request, functionId: int = Form(...)):
    # Yazdığınız fonksiyonu burada kullanın
    function_parameters = get_function_parameters(functionId)  # İlk fonksiyonun id'sine göre yöntemleri al
    # 2. View'a sonuçları gönder
    return function_parameters


@router.post("/get-methods-params")
async def get_params(method_id: Optional[int] = Form(None), parent_id: Optional[int] = Form(None)):
    # 1. Veritabanından ham (flat) verileri çek
    # parent_id None ise ana parametreler, doluysa alt parametreler gelir
    if parent_id is None: parent_id = 0
    if method_id is None: method_id = 0
    structured_params = get_method_parameters(method_id=method_id, method_parameter_id=parent_id)

    # 3. JSON response olarak döndür
    return structured_params


