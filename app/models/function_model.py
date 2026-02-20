from pydantic import BaseModel, ConfigDict
from typing import Optional

class FunctionModel(BaseModel):
    # Pydantic v2 için yeni konfigürasyon yapısı
    model_config = ConfigDict(from_attributes=True)

    Id: int
    Name: str
    Value: str
    Order: int