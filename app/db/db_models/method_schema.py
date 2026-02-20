import uuid
from pydantic import BaseModel, Field
from typing import Optional

class MethodSchema(BaseModel):
    Id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    FunctionId: str  # Tbl_Function tablosundaki Id
    MethodKey: Optional[str] = None
    MethodName: Optional[str] = None
    OrderNumber: Optional[int] = 0

