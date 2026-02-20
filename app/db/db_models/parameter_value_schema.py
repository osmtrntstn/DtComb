from pydantic import BaseModel, Field
from typing import Optional, List
import uuid


class ParameterValueSchema(BaseModel):
    Id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    ParameterId: str = None
    ValueKey: str = None
    ValueName: str = None
    ExistSubItem: int = 0
    OrderNumber: int = 0
