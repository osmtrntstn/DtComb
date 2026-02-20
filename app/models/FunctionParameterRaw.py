from pydantic import BaseModel, ConfigDict
from typing import Optional
from typing import List

class FunctionParameterRaw(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    FunctionParameterId: int
    FunctionId: int
    FunctionParameterName: str
    Value: str  # Parametrenin görünen adı (Label)
    InputType: str
    FunctionParameterValueId: int
    FunctionParameterValueName: str # R tarafına gidecek teknik isim
    FunctionParameterValue: str     # Dropdown'da görünecek metin
    Order: int


class ParameterValue(BaseModel):
    Id: int
    Name: str
    Value: str
    HaveSub: int

class GroupedParameter(BaseModel):
    Id: int
    Name: str
    Label: str
    InputType: str
    Options: List[ParameterValue]