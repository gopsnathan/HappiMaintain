from __future__ import annotations

from fastapi import Cookie, Depends, HTTPException, status
from app.core.security import decode_token
from app.core.database import get_db
from app.models.user import Role
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId


async def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )
    if not access_token:
        raise credentials_exception

    payload = decode_token(access_token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception

    user_id = payload.get("sub")
    if not user_id or not ObjectId.is_valid(user_id):
        raise credentials_exception

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise credentials_exception

    return user


async def require_approved(user: dict = Depends(get_current_user)) -> dict:
    if not user.get("is_approved") or user.get("role") == Role.pending:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending admin approval",
        )
    return user


async def require_admin(user: dict = Depends(require_approved)) -> dict:
    if user.get("role") != Role.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


async def require_contributor(user: dict = Depends(require_approved)) -> dict:
    if user.get("role") not in (Role.contributor, Role.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Contributor access required",
        )
    return user
