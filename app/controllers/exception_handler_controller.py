from fastapi import Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException as StarletteHTTPException

templates = Jinja2Templates(directory="app/views")  # HTML dosyalarının olduğu klasör

async def custom_404_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        # Burada kullanıcıyı özel bir HTML sayfasına yönlendiriyoruz
        return templates.TemplateResponse("404.html", {"request": request}, status_code=404)

    # Diğer hatalar (500, 403 vb.) için varsayılan davranışı sürdür
    return HTMLResponse(content=str(exc.detail), status_code=exc.status_code)