from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import Role


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: Role
    is_approved: bool
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class AssignRoleRequest(BaseModel):
    role: Role
