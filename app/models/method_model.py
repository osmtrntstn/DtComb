from pydantic import BaseModel, ConfigDict
from typing import Optional

class MethodModel(BaseModel):
    # Pydantic v2 için yeni konfigürasyon yapısı
    model_config = ConfigDict(from_attributes=True)
    Id: Optional[str]
    FunctionId: str  # Tbl_Function tablosundaki Id
    MethodKey: Optional[str] = None
    MethodName: Optional[str] = None
    OrderNumber: Optional[int] = 0