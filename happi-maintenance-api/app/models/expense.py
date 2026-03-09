from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from bson import ObjectId
from pydantic import BaseModel, Field, GetCoreSchemaHandler
from pydantic_core import core_schema


class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler: GetCoreSchemaHandler):
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId")


class DeleteRequestStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class DeleteRequest(BaseModel):
    requested_by: str
    requested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: DeleteRequestStatus = DeleteRequestStatus.pending
    reviewed_at: datetime | None = None


class ExpenseInDB(BaseModel):
    id: PyObjectId = Field(alias="_id", default=None)
    title: str
    amount: float
    category_id: str
    category_name: str = ""
    created_by: str
    created_by_name: str = ""
    date: datetime
    notes: str = ""
    delete_request: DeleteRequest | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
