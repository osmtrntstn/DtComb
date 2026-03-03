from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse
from starlette.templating import Jinja2Templates
from app.config import get_settings
from app.utils.logger import log_info, log_warning

router = APIRouter()
templates = Jinja2Templates(directory="app/views")
settings = get_settings()

@router.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request, "url_for": request.url_for})

@router.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    # TODO: Implement proper password hashing with passlib
    # For now, using environment variables for credentials
    if username == settings.ADMIN_USERNAME and password == settings.ADMIN_PASSWORD:
        request.session["is_logged_in"] = True
        request.session["user"] = username
        log_info(f"User {username} logged in successfully")
        return RedirectResponse(url="admin", status_code=303)

    log_warning(f"Failed login attempt for username: {username}")
    return RedirectResponse(url="login?error=true", status_code=303)

@router.get("/logout")
async def logout(request: Request):
    username = request.session.get("user", "unknown")
    request.session.clear()
    log_info(f"User {username} logged out")
    return RedirectResponse(url="login")