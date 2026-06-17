"""
CreditLens AI — MSME CRUD Routes
"""

import uuid
from fastapi import APIRouter, HTTPException, Depends, Query
from app.database import database
from app.models.msme import MSMEProfile, MSMECreate, MSMEListItem
from app.utils.security import decode_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/msmes", tags=["MSMEs"])
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency: validate JWT and return user payload."""
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


@router.get("")
async def list_msmes(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sector: str = Query(None),
    state: str = Query(None),
    user=Depends(get_current_user),
):
    """List all MSMEs with optional filtering."""
    query = {}
    if sector:
        query["sector"] = sector
    if state:
        query["state"] = state

    cursor = database.msmes.find(query).skip(skip).limit(limit)
    msmes = await cursor.to_list(length=limit)

    total = await database.msmes.count_documents(query)

    return {
        "msmes": [
            {
                "msme_id": m["msme_id"],
                "business_name": m["business_name"],
                "sector": m["sector"],
                "state": m["state"],
                "employee_count": m["employee_count"],
                "monthly_gst_turnover_avg": m["monthly_gst_turnover_avg"],
                "latest_score": m.get("latest_score"),
                "risk_tier": m.get("risk_tier"),
            }
            for m in msmes
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/search")
async def search_msmes(
    q: str = Query(..., min_length=1),
    user=Depends(get_current_user),
):
    """Search MSMEs by business name (case-insensitive substring match)."""
    all_msmes = await database.msmes.find({}).to_list(length=2000)

    q_lower = q.lower()
    results = [
        {
            "msme_id": m["msme_id"],
            "business_name": m["business_name"],
            "sector": m["sector"],
            "state": m["state"],
            "employee_count": m["employee_count"],
            "monthly_gst_turnover_avg": m["monthly_gst_turnover_avg"],
            "latest_score": m.get("latest_score"),
            "risk_tier": m.get("risk_tier"),
        }
        for m in all_msmes
        if q_lower in m["business_name"].lower()
        or q_lower in m["sector"].lower()
        or q_lower in m["state"].lower()
        or q_lower in m.get("msme_id", "").lower()
    ]

    return {"msmes": results[:50], "total": len(results)}


@router.get("/{msme_id}")
async def get_msme(msme_id: str, user=Depends(get_current_user)):
    """Get full MSME profile by ID."""
    msme = await database.msmes.find_one({"msme_id": msme_id})
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    # Remove MongoDB's _id field for JSON serialization
    msme.pop("_id", None)
    return msme


@router.post("")
async def create_msme(msme_data: MSMECreate, user=Depends(get_current_user)):
    """Create a new MSME profile."""
    msme_id = str(uuid.uuid4())
    doc = {"msme_id": msme_id, **msme_data.model_dump()}
    await database.msmes.insert_one(doc)
    return {"msme_id": msme_id, "message": "MSME profile created"}
