from typing import Optional

from fastapi import APIRouter, Request, Form, HTTPException, Depends
from fastapi.templating import Jinja2Templates

from app.db import crud_operation
from app.db.db_models.function_schema import FunctionSchema
from app.db.db_models.method_schema import MethodSchema
from app.db.db_models.parameter_schema import ParameterSchema
from app.injections.sesion_control import check_session

# router = APIRouter()
# router = APIRouter() yerine bunu kullan:
router = APIRouter(dependencies=[Depends(check_session)])
templates = Jinja2Templates(directory="app/views")


@router.get("/admin")
def index(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request, "title": "Hoş Geldiniz"})


@router.get("/get-params/{parent_id}/{name}")
def index(request: Request, parent_id: str, name: str):
    parameters = crud_operation.get_parameters_by_parent(parent_id)
    return templates.TemplateResponse("get-params.html",
                                      {"request": request, "title": "Hoş Geldiniz", "parameters": parameters,
                                       "parent_id": parent_id, "name": name})


@router.get("/update-param")
def index(request: Request, id: Optional[str] = "", parent_id: Optional[str] = ""):
    parameter = crud_operation.get_parameters_by_id(id)

    return templates.TemplateResponse("add-param.html",
                                      {"request": request, "title": "Hoş Geldiniz", "parameter": parameter, "id": id,
                                       "parent_id": parent_id})


@router.get("/functions")
def get_all_functions():
    # SELECT * FROM Tbl_Function ORDER BY OrderNumber
    return crud_operation.get_functions()


@router.post("/functions/save")
def save_function(data: FunctionSchema):
    crud_operation.save_function(data);
    return {"status": "success"}


@router.delete("/functions/{id}")
def delete_function(id: str):
    crud_operation.delete_function(id)
    return {"status": "deleted"}


# Listeleme: Hangi fonksiyona ait olduğunu FunctionName ile çekiyoruz
@router.get("/methods")
def get_methods():
    return crud_operation.get_methods()


# Silme İşlemi
@router.delete("/methods/{id}")
def delete_method(id: str):
    try:
        # Silme işlemini gerçekleştir
        result = crud_operation.delete_method(id)

        # Eğer etkilenen satır yoksa (ID bulunamadıysa)
        if result == 0:
            raise HTTPException(status_code=404, detail="Metot bulunamadı.")

        return {"status": "deleted"}
    except Exception as e:
        # Konsola gerçek hatayı yazdırın (Örn: table not found, syntax error)
        print(f"Silme Hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sunucu Hatası: {str(e)}")


# Kaydetme Fonksiyonu
@router.post("/methods/save")
def save_method(data: MethodSchema):
    crud_operation.save_method(data)
    return


@router.get("/parameters/{parent_id}")
def get_parameters_by_parent(parent_id: str):
    return crud_operation.get_parameters_by_parent(parent_id)


@router.post("/parameters/save")
def save_parameter(data: ParameterSchema):
    crud_operation.save_parameter_bulk(data)
    return {"status": "success", "Id": data.Id}


@router.delete("/parameters/{id}")
def delete_parameter(id: str):
    crud_operation.delete_parameter(id)
    return {"status": "deleted"}


@router.get("/parameter-values/{parameter_id}")
def get_parameter_values(parameter_id: str):
    return crud_operation.get_parameter_values(parameter_id)


@router.get("/get-all-data")
def get_parameter_values():
    return crud_operation.generate_insert_scripts()


@router.delete("/delete-param-value/{id}")
def delete_parameter_value(id: str):
    crud_operation.delete_parameter_value(id)
    return {"status": "deleted"}


@router.post("/run-sql")
def run_sql(data: str = Form(...)):
    crud_operation.run_sql(data)
    return {"status": "ok"}
