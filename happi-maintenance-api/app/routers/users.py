from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.database import get_db
from app.dependencies.auth import require_admin, require_approved
from app.schemas.user import AssignRoleRequest, UserOut
from app.models.user import Role

router = APIRouter(prefix="/api/v1/users", tags=["users"])


def _user_out(u: dict) -> UserOut:
    return UserOut(
        id=str(u["_id"]),
        email=u["email"],
        name=u["name"],
        role=u["role"],
        is_approved=u.get("is_approved", False),
        created_at=u.get("created_at"),
    )


@router.get("/", response_model=list[UserOut])
async def list_users(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
):
    users = await db.users.find().to_list(1000)
    return [_user_out(u) for u in users]


@router.patch("/{user_id}/approve", response_model=UserOut)
async def approve_user(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")
    result = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_approved": True, "role": Role.contributor}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_out(result)


@router.patch("/{user_id}/role", response_model=UserOut)
async def assign_role(
    user_id: str,
    body: AssignRoleRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")
    if body.role == Role.pending:
        raise HTTPException(status_code=400, detail="Cannot assign pending role")
    result = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": body.role}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_out(result)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")
    if str(admin["_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
