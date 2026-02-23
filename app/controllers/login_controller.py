from fastapi import Response, APIRouter, Request, Form
from fastapi.responses import RedirectResponse
from starlette.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/views")

@router.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    # Burayı kendi kullanıcı kontrol mekanizmanıza göre güncelleyin
    if username == "admin" and password == "123456":
        request.session["is_logged_in"] = True
        request.session["user"] = username
        return RedirectResponse(url="/admin", status_code=303)

    return RedirectResponse(url="/login?error=true", status_code=303)

@router.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/login")