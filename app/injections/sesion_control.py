from fastapi import HTTPException,Request,status


async def check_session(request: Request):
    if not request.session.get("is_logged_in"):
        # Doğrudan yönlendirme yerine 401 (Yetkisiz) hatası fırlatıyoruz
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return True