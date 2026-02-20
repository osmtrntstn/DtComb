from pydantic import BaseModel, Field
from typing import Optional, List
import uuid

from app.db.db_models.parameter_value_schema import ParameterValueSchema


class ParameterSchema(BaseModel):
    Id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    ParentId: str  # FunctionId, MethodId veya bir başka ParameterId
    ParameterKey: Optional[str] = None
    ParameterName: Optional[str] = None
    InputType: Optional[str] = "text"  # text, number, select vb.
    DefaultValue: Optional[str] = None
    MinValue: Optional[float] = None
    MaxValue: Optional[float] = None
    OrderNumber: Optional[int] = 0
    ExistSubItem: int = 0
    ValueStep: Optional[float] = None
    # Alt değerlerin listesi (JSON'daki "Values" anahtarı ile eşleşir)
    Values: List[ParameterValueSchema] = []

    class Config:
        from_attributes = True