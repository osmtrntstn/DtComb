from fastapi import APIRouter, Request, Form
from fastapi.templating import Jinja2Templates
from starlette.responses import HTMLResponse

router = APIRouter()
templates = Jinja2Templates(directory="app/views")

@router.get("/predict", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("predict.html", {"request": request, "title": "Hoş Geldiniz"})
