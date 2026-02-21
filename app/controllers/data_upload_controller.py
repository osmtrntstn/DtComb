import uuid
import json
import pandas as pd
import io

from fastapi import APIRouter, Request, UploadFile, File, Form, Body
from fastapi.templating import Jinja2Templates
from app.services.r_data_engine import get_data

router = APIRouter()
templates = Jinja2Templates(directory="app/views")


@router.get("/data-upload")
async def index(request: Request):
    last_selected = request.session.get("selected_dataset", "laparotomy")
    r_output = get_data({"exampleData": last_selected})
    parsed_data = json.loads(r_output)
    return templates.TemplateResponse("data_upload.html",
                                      {"request": request, "title": "Hoş Geldiniz"})


@router.post("/fetch-example-data")
async def fetch_example_data(request: Request, data_name: str = Form(...)):
    # R scriptini çalıştır ve veriyi al
    # 'value' parametresine analiz için varsayılan bir değer (örn: 0) gönderiyoruz
    r_output = get_data({"exampleData": data_name})
    request.session["selected_dataset"] = data_name

    # R'dan gelen string'i Python dict yapısına çevirip JSON olarak dön
    return json.loads(r_output)


@router.post("/get-unique-categories")
async def get_unique_categories(request: Request, status_col: str = Form(...), data: str = Form(...),
                                delimiter: str = Form(...)):
    selectedCategory = ""
    df = None
    column_names = None
    try:
        if data == "example":
            # 1. R'dan gelen JSON metnini sözlüğe çevir
            r_output = json.loads(get_data({"exampleData": delimiter}))

            # 2. 'data' anahtarındaki metni DataFrame'e dönüştür
            # Not: R tarafı CSV formatında string döndürüyorsa StringIO şarttır.
            csv_data = r_output.get("data", "")
            column_names = r_output.get("columns", [])  # Kolon listesini al
            df = pd.DataFrame(csv_data, columns=column_names)

            selectedCategory = r_output.get("selectedCategory", "")
        else:
            # Kullanıcının yüklediği ham veriyi ayırıcıya göre oku
            sep = ","
            if delimiter == "tab":
                sep = "\t"
            elif delimiter == "semicolon":
                sep = ";"
            elif delimiter == "space":
                sep = " "

            df = pd.read_csv(io.StringIO(data), sep=sep)
            column_names = df.columns.tolist()  # Kolon isimlerini al

        # 3. DataFrame kontrolü ve kategori ayıklama
        if df is not None and status_col in column_names:
            # NaN değerleri temizle ve benzersiz değerleri listele
            unique_values = df[status_col].dropna().unique().tolist()
            return {
                "categories": [str(val) for val in unique_values],
                "selectedCategory": str(selectedCategory)
            }

    except Exception as e:
        return {"categories": [], "error": f"İşlem sırasında hata oluştu: {str(e)}"}

    return {"categories": [], "error": "Veri veya kolon bulunamadı."}
