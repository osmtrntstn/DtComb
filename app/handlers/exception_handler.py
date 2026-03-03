from fastapi import Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.responses import JSONResponse

from app.utils.logger import log_error, log_warning, log_info

templates = Jinja2Templates(directory="app/views")  # HTML dosyalarının olduğu klasör

async def custom_exception_handler(request: Request, exc: Exception):
    status_code = getattr(exc, "status_code", 500)
    error_detail = getattr(exc, "detail", "No details provided")

    # Log the error based on severity
    if status_code >= 500:
        log_error(f"Server Error {status_code} at {request.url.path}: {error_detail}", exc)
    elif status_code >= 400:
        log_warning(f"Client Error {status_code} at {request.url.path}: {error_detail}")
    else:
        log_info(f"HTTP {status_code} at {request.url.path}")

    # AJAX isteği kontrolü (X-Requested-With header veya Accept: application/json)
    is_ajax = (
            request.headers.get("x-requested-with") == "XMLHttpRequest" or
            "application/json" in request.headers.get("accept", "")
    )

    if status_code == 401:
        log_info(f"Unauthorized access attempt to {request.url.path}")
        return RedirectResponse(url="login", status_code=303)

    status_code = getattr(exc, "status_code", 500)

    # Hata kodlarına göre dinamik içerik
    error_data = {
        400: {"title": "Bad Request", "icon": "warning",
              "message": "The server could not understand the request due to invalid syntax."},
        401: {"title": "Unauthorized", "icon": "error",
              "message": "Access is denied due to invalid credentials."},
        403: {"title": "Forbidden", "icon": "error",
              "message": "You do not have permission to access this resource."},
        404: {"title": "Page Not Found", "icon": "warning",
              "message": "The page you are looking for seems to have vanished."},
        422: {"title": "Validation Error", "icon": "warning",
              "message": "The server understands the request but cannot process the contained instructions."},
        500: {"title": "Server Error", "icon": "error",
              "message": "Something went wrong internally, our team is looking into it."},
        502: {"title": "Bad Gateway", "icon": "error",
              "message": "The server received an invalid response from the upstream server."},
        503: {"title": "Service Unavailable", "icon": "error",
              "message": "The server is currently unavailable due to maintenance or overload."},
        "default": {"title": "An Error Occurred", "icon": "error",
                    "message": "We encountered an unexpected situation."}
    }

    content = error_data.get(status_code, error_data["default"])

    if is_ajax:
        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "status_code": status_code,
                "title": content["title"],
                "message": content["message"],
                "detail": error_detail,
                "icon": content["icon"],
            }
        )

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