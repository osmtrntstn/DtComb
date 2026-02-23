from fastapi import Request,status
from fastapi.responses import HTMLResponse,RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException as StarletteHTTPException

templates = Jinja2Templates(directory="app/views")  # HTML dosyalarının olduğu klasör

async def custom_exception_handler(request: Request, exc: Exception):
    if exc.status_code == 401:
        return RedirectResponse(url="/login", status_code=303)
    # if exc.status_code == 404:
    #     return templates.TemplateResponse("error.html", {"request": request}, status_code=404)

    status_code = getattr(exc, "status_code", 500)

    # Hata kodlarına göre dinamik içerik
    error_data = {
        404: {"title": "Page NotFound", "icon": "fa-ghost", "message": "Aradığınız yol kaybolmuş gibi görünüyor."},
        403: {"title": "Yetkisiz Erişim", "icon": "fa-lock", "message": "Buraya girmek için izniniz bulunmuyor."},
        500: {"title": "Sunucu Hatası", "icon": "fa-server",
              "message": "İçeride bir şeyler ters gitti, ekiplerimiz bakıyor."},
        "default": {"title": "Bir Hata Oluştu", "icon": "fa-exclamation-triangle",
                    "message": "Beklenmedik bir durumla karşılaştık."}
    }

    content = error_data.get(status_code, error_data["default"])
    return templates.TemplateResponse(
        "error.html",
        {
            "request": request,
            "status_code": status_code,
            "title": content["title"],
            "message": content["message"],
            "icon": content["icon"]
        },
        status_code=status_code
    )