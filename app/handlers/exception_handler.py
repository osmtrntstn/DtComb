from fastapi import Request,status
from fastapi.responses import HTMLResponse,RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException as StarletteHTTPException

templates = Jinja2Templates(directory="app/views")  # HTML dosyalarının olduğu klasör

async def custom_exception_handler(request: Request, exc: Exception):
    if exc.status_code == 401:
        return RedirectResponse(url="/login", status_code=303)
    if exc.status_code == 404:
        return templates.TemplateResponse("404.html", {"request": request}, status_code=404)
    return HTMLResponse(content=str(exc.detail), status_code=exc.status_code)
