from datetime import datetime, timezone
from enum import Enum
from typing import Annotated, Any
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


class Role(str, Enum):
    pending = "pending"
    contributor = "contributor"
    admin = "admin"


class UserInDB(BaseModel):
    id: PyObjectId = Field(alias="_id", default=None)
    email: str
    name: str
    hashed_password: str
    role: Role = Role.pending
    is_approved: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
