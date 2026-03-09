from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.database import get_db
from app.dependencies.auth import require_admin, require_approved
from app.schemas.category import CategoryCreate, CategoryOut

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


def _cat_out(c: dict) -> CategoryOut:
    return CategoryOut(
        id=str(c["_id"]),
        name=c["name"],
        color=c.get("color", "#6366f1"),
        icon=c.get("icon", "tag"),
        created_by=c["created_by"],
        created_at=c.get("created_at"),
    )


@router.get("/", response_model=list[CategoryOut])
async def list_categories(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_approved),
):
    cats = await db.categories.find().to_list(500)
    return [_cat_out(c) for c in cats]


@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    body: CategoryCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    if await db.categories.find_one({"name": {"$regex": f"^{body.name}$", "$options": "i"}}):
        raise HTTPException(status_code=400, detail="Category already exists")
    doc = {**body.model_dump(), "created_by": str(admin["_id"])}
    result = await db.categories.insert_one(doc)
    created = await db.categories.find_one({"_id": result.inserted_id})
    return _cat_out(created)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
):
    if not ObjectId.is_valid(category_id):
        raise HTTPException(status_code=400, detail="Invalid category id")
    result = await db.categories.delete_one({"_id": ObjectId(category_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
