from fastapi import APIRouter, Request, Form
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/views")

@router.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "title": "Hoş Geldiniz", "url_for": request.url_for})

@router.get("/manuel")
async def index(request: Request):
    return templates.TemplateResponse("manuel.html", {"request": request, "title": "Hoş Geldiniz", "url_for": request.url_for})
