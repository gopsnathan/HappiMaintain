from __future__ import annotations

from datetime import timedelta
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.core.config import settings
from app.dependencies.auth import get_current_user
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse
from app.schemas.user import UserOut
from app.models.user import Role

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

ACCESS_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
REFRESH_MAX_AGE = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400


def _set_tokens(response: Response, user_id: str):
    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)
    response.set_cookie("access_token", access, httponly=True, samesite="lax", max_age=ACCESS_MAX_AGE)
    response.set_cookie("refresh_token", refresh, httponly=True, samesite="lax", max_age=REFRESH_MAX_AGE)


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    if await db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    await db.users.insert_one({
        "email": body.email,
        "name": body.name,
        "hashed_password": hash_password(body.password),
        "role": Role.pending,
        "is_approved": False,
    })
    return {"message": "Account created. Awaiting admin approval."}


@router.post("/login")
async def login(body: LoginRequest, response: Response, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("is_approved"):
        raise HTTPException(status_code=403, detail="Account pending admin approval")
    _set_tokens(response, str(user["_id"]))
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
    }


@router.post("/refresh")
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("sub")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("is_approved"):
        raise HTTPException(status_code=401, detail="User not found or not approved")
    _set_tokens(response, user_id)
    return {"message": "ok"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return UserOut(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        role=user["role"],
        is_approved=user["is_approved"],
        created_at=user.get("created_at"),
    )
