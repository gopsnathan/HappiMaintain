from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.database import get_db
from app.dependencies.auth import require_admin, require_approved, require_contributor
from app.models.expense import DeleteRequestStatus
from app.models.user import Role
from app.schemas.expense import ExpenseCreate, ExpenseOut, ExpenseUpdate

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


async def _expense_out(e: dict, db: AsyncIOMotorDatabase) -> ExpenseOut:
    # Enrich category name
    cat_name = e.get("category_name", "")
    if not cat_name and ObjectId.is_valid(e.get("category_id", "")):
        cat = await db.categories.find_one({"_id": ObjectId(e["category_id"])})
        cat_name = cat["name"] if cat else ""

    # Enrich creator name
    creator_name = e.get("created_by_name", "")
    if not creator_name and ObjectId.is_valid(e.get("created_by", "")):
        u = await db.users.find_one({"_id": ObjectId(e["created_by"])})
        creator_name = u["name"] if u else ""

    return ExpenseOut(
        id=str(e["_id"]),
        title=e["title"],
        amount=e["amount"],
        category_id=e.get("category_id", ""),
        category_name=cat_name,
        created_by=e["created_by"],
        created_by_name=creator_name,
        date=e["date"],
        notes=e.get("notes", ""),
        delete_request=e.get("delete_request"),
        created_at=e.get("created_at"),
        updated_at=e.get("updated_at"),
    )


@router.get("/", response_model=list[ExpenseOut])
async def list_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    category_id: str | None = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(require_approved),
):
    query: dict = {}
    if category_id:
        query["category_id"] = category_id
    expenses = await db.expenses.find(query).sort("date", -1).skip(skip).limit(limit).to_list(limit)
    return [await _expense_out(e, db) for e in expenses]


@router.post("/", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(
    body: ExpenseCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(require_contributor),
):
    if not ObjectId.is_valid(body.category_id):
        raise HTTPException(status_code=400, detail="Invalid category id")
    cat = await db.categories.find_one({"_id": ObjectId(body.category_id)})
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    now = datetime.now(timezone.utc)
    doc = {
        **body.model_dump(),
        "category_name": cat["name"],
        "created_by": str(user["_id"]),
        "created_by_name": user["name"],
        "delete_request": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.expenses.insert_one(doc)
    created = await db.expenses.find_one({"_id": result.inserted_id})
    return await _expense_out(created, db)


@router.patch("/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    expense_id: str,
    body: ExpenseUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(require_approved),
):
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(status_code=400, detail="Invalid expense id")
    expense = await db.expenses.find_one({"_id": ObjectId(expense_id)})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    is_admin = user.get("role") == Role.admin
    is_owner = expense["created_by"] == str(user["_id"])
    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Not authorized")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        return await _expense_out(expense, db)

    updates["updated_at"] = datetime.now(timezone.utc)
    updated = await db.expenses.find_one_and_update(
        {"_id": ObjectId(expense_id)},
        {"$set": updates},
        return_document=True,
    )
    return await _expense_out(updated, db)


@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
async def delete_expense(
    expense_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(require_approved),
):
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(status_code=400, detail="Invalid expense id")
    expense = await db.expenses.find_one({"_id": ObjectId(expense_id)})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    is_admin = user.get("role") == Role.admin
    is_owner = expense["created_by"] == str(user["_id"])

    if is_admin:
        await db.expenses.delete_one({"_id": ObjectId(expense_id)})
        return {"message": "Expense deleted"}

    if is_owner:
        # Create delete request
        now = datetime.now(timezone.utc)
        delete_request = {
            "requested_by": str(user["_id"]),
            "requested_at": now,
            "status": DeleteRequestStatus.pending,
            "reviewed_at": None,
        }
        await db.expenses.update_one(
            {"_id": ObjectId(expense_id)},
            {"$set": {"delete_request": delete_request}},
        )
        return {"message": "Delete request submitted for admin approval"}

    raise HTTPException(status_code=403, detail="Not authorized")


@router.patch("/{expense_id}/approve-delete")
async def approve_delete(
    expense_id: str,
    approve: bool = Query(True),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
):
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(status_code=400, detail="Invalid expense id")
    expense = await db.expenses.find_one({"_id": ObjectId(expense_id)})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if not expense.get("delete_request"):
        raise HTTPException(status_code=400, detail="No pending delete request")

    if approve:
        await db.expenses.delete_one({"_id": ObjectId(expense_id)})
        return {"message": "Expense deleted"}
    else:
        await db.expenses.update_one(
            {"_id": ObjectId(expense_id)},
            {"$set": {"delete_request.status": DeleteRequestStatus.rejected,
                       "delete_request.reviewed_at": datetime.now(timezone.utc)}},
        )
        return {"message": "Delete request rejected"}
