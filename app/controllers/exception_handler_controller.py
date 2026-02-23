from fastapi import Request,status
from fastapi.responses import HTMLResponse,RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException as StarletteHTTPException

templates = Jinja2Templates(directory="app/views")  # HTML dosyalarının olduğu klasör

async def custom_404_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        return templates.TemplateResponse("404.html", {"request": request}, status_code=404)
    return HTMLResponse(content=str(exc.detail), status_code=exc.status_code)

async def auth_exception_handler(request: Request, exc: Exception):
    # Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)