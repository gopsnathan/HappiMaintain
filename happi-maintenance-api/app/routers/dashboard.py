from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.dependencies.auth import require_approved

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/summary")
async def summary(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_approved),
):
    total_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}]
    total_result = await db.expenses.aggregate(total_pipeline).to_list(1)
    total_amount = total_result[0]["total"] if total_result else 0
    total_count = total_result[0]["count"] if total_result else 0

    user_count = await db.users.count_documents({"is_approved": True})
    pending_count = await db.users.count_documents({"is_approved": False})
    pending_deletes = await db.expenses.count_documents({"delete_request.status": "pending"})

    category_pipeline = [
        {"$group": {"_id": "$category_name", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$sort": {"total": -1}},
    ]
    by_category = await db.expenses.aggregate(category_pipeline).to_list(50)

    return {
        "total_amount": round(total_amount, 2),
        "total_expenses": total_count,
        "active_users": user_count,
        "pending_approvals": pending_count,
        "pending_delete_requests": pending_deletes,
        "by_category": [{"name": r["_id"] or "Uncategorized", "total": round(r["total"], 2), "count": r["count"]} for r in by_category],
    }


@router.get("/charts")
async def charts(
    months: int = Query(6, ge=1, le=24),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_approved),
):
    # Monthly trend
    monthly_pipeline = [
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$date"},
                    "month": {"$month": "$date"},
                },
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}},
        {"$limit": months},
    ]
    monthly = await db.expenses.aggregate(monthly_pipeline).to_list(months)

    # Category pie
    cat_pipeline = [
        {"$group": {"_id": "$category_name", "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}},
    ]
    by_category = await db.expenses.aggregate(cat_pipeline).to_list(20)

    # User contribution
    user_pipeline = [
        {"$group": {"_id": "$created_by_name", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$sort": {"total": -1}},
        {"$limit": 10},
    ]
    by_user = await db.expenses.aggregate(user_pipeline).to_list(10)

    return {
        "monthly_trend": [
            {
                "month": f"{r['_id']['year']}-{r['_id']['month']:02d}",
                "total": round(r["total"], 2),
                "count": r["count"],
            }
            for r in monthly
        ],
        "by_category": [{"name": r["_id"] or "Uncategorized", "total": round(r["total"], 2)} for r in by_category],
        "by_user": [{"name": r["_id"] or "Unknown", "total": round(r["total"], 2), "count": r["count"]} for r in by_user],
    }
