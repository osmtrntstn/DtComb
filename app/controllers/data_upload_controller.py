from fastapi import APIRouter, Request, Form
from fastapi.templating import Jinja2Templates

from app.services import data_upload_service

router = APIRouter()
templates = Jinja2Templates(directory="app/views")


@router.get("/data-upload")
def index(request: Request):
    return templates.TemplateResponse("data_upload.html",
                                      {"request": request, "title": "Hoş Geldiniz"})


@router.post("/fetch-example-data")
async def fetch_example_data(request: Request, data_name: str = Form(...)):
    return await data_upload_service.fetch_example_data(data_name)


@router.post("/get-unique-categories")
async def get_unique_categories(request: Request, status_col: str = Form(...), data: str = Form(...),
                                delimiter: str = Form(...)):
    return await data_upload_service.get_unique_categories(status_col, data, delimiter)
