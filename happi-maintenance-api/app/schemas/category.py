from datetime import datetime
from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    color: str = "#6366f1"
    icon: str = "tag"


class CategoryOut(BaseModel):
    id: str
    name: str
    color: str
    icon: str
    created_by: str
    created_at: datetime
