# app/schemas/function_schema.py
from pydantic import BaseModel, Field
from typing import Optional

class FunctionSchema(BaseModel):
    # Eğer Id None veya boş gelirse uuid oluşturur
    Id: Optional[str] = None 
    FunctionKey: Optional[str] = None
    FunctionName: Optional[str] = None
    OrderNumber: Optional[int] = 0