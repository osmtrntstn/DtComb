import uuid
import json
import pandas as pd
import io

from fastapi import APIRouter, Request, UploadFile, File, Form, Body
from fastapi.templating import Jinja2Templates
from app.services.r_data_engine import get_data

router = APIRouter()
templates = Jinja2Templates(directory="app/views")


@router.post("/update-session")
async def update_session(request: Request, data: dict = Body(...)):
    # Mevcut session verilerini al veya boş sözlük oluştur
    current_session = request.session.get("user_selections", {})

    # Yeni gelen verilerle session'ı güncelle
    current_session.update(data)

    # Session'a geri yaz
    request.session["user_selections"] = current_session
    return {"status": "success"}
@router.get("/data-upload")
async def index(request: Request):
    last_selected = request.session.get("selected_dataset", "laparotomy")
    r_output = get_data({"exampleData": last_selected})
    parsed_data = json.loads(r_output)
    return templates.TemplateResponse("data_upload.html",
                                      {"request": request, "result": parsed_data, "title": "Hoş Geldiniz"})


@router.post("/fetch-example-data")
async def fetch_example_data(request: Request, data_name: str = Form(...)):
    # R scriptini çalıştır ve veriyi al
    # 'value' parametresine analiz için varsayılan bir değer (örn: 0) gönderiyoruz
    r_output = get_data({"exampleData": data_name})
    request.session["selected_dataset"] = data_name

    # R'dan gelen string'i Python dict yapısına çevirip JSON olarak dön
    return json.loads(r_output)


@router.post("/data-upload")
async def data_upload(request: Request):
    # Yazdığınız fonksiyonu burada kullanın
    result = get_data({"value": 1.1})
    # 2. View'a sonuçları gönder
    return templates.TemplateResponse("data_upload.html", {
        "request": request,
        "result": result,
        "user_val": 1.1
    })


storage = {}  # Kullanıcı verilerini tutan sözlük


@router.post("/upload-csv")
async def upload_csv(request: Request, file: UploadFile = File(...), delimiter: str = Form(...)):
    # 1. Ayırıcıyı (delimiter) belirle
    sep = ","
    if delimiter == "tab":
        sep = "\t"
    elif delimiter == "semicolon":
        sep = ";"
    elif delimiter == "space":
        sep = " "

    # 2. Dosya içeriğini oku
    contents = await file.read()

    # 3. Pandas ile oku (Hata burada oluşuyordu, artık doğru buffer gidiyor)
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')), sep=sep)

    # 4. NaN (boş) değerleri JSON uyumlu hale getir (None yap)
    df = df.where(pd.notnull(df), None)

    # 5. Kullanıcı bazlı UUID/Session yönetimi
    user_id = request.session.get("user_id")
    if not user_id:
        user_id = str(uuid.uuid4())
        request.session["user_id"] = user_id

    # Veriyi bu kullanıcıya özel olarak hafızaya kaydet
    storage[user_id] = df

    return {
        "columns": df.columns.tolist(),
        "data": df.to_dict(orient='records')
    }


@router.post("/get-unique-categories")
async def get_unique_categories(request: Request, status_col: str = Form(...)):
    user_id = request.session.get("user_id")
    df = storage.get(user_id)  # Sadece bu kullanıcının verisi

    if df is not None and status_col in df.columns:
        unique_values = df[status_col].dropna().unique().tolist()
        return {"categories": [str(val) for val in unique_values]}

    return {"categories": [], "error": "Veri bulunamadı."}
