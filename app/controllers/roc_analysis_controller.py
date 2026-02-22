from fastapi import APIRouter, Request, Form
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/views")

@router.get("/roc-analysis")
async def index(request: Request):
    return templates.TemplateResponse("roc-analysis.html", {"request": request, "title": "Hoş Geldiniz"})
