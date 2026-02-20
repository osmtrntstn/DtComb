from pydantic import BaseModel, ConfigDict
from typing import List, Optional

# Seçenekleri (Dropdown/Radio) temsil eden model
class MethodParameterValueModel(BaseModel):
    Id: Optional[int] = None
    Name: Optional[str] = None
    Value: Optional[str] = None

# Ana parametre yapısı
class MethodParameterModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    Id: int
    MethodId: int
    Name: str
    Label: str
    InputType: str
    DefaultValue: Optional[str] = None
    Min: Optional[float] = None
    Max: Optional[float] = None
    ParentParameterId: Optional[int] = None
    # Parametrenin altındaki seçenekler listesi
    Options: List[MethodParameterValueModel] = []