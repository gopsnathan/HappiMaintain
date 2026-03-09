from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel
from app.models.expense import DeleteRequest


class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category_id: str
    date: datetime
    notes: str = ""


class ExpenseUpdate(BaseModel):
    title: str | None = None
    amount: float | None = None
    category_id: str | None = None
    date: datetime | None = None
    notes: str | None = None


class ExpenseOut(BaseModel):
    id: str
    title: str
    amount: float
    category_id: str
    category_name: str
    created_by: str
    created_by_name: str
    date: datetime
    notes: str
    delete_request: DeleteRequest | None
    created_at: datetime
    updated_at: datetime
