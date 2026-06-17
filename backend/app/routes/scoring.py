"""
CreditLens AI — Scoring Routes
"""

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import database
from app.services.ml_service import ml_service
from app.utils.security import decode_access_token

router = APIRouter(prefix="/api/score", tags=["Scoring"])
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


@router.post("/{msme_id}")
async def score_msme(msme_id: str, user=Depends(get_current_user)):
    """
    Score an MSME profile using the ML engine.
    Generates a new Financial Health Score and saves it to history.
    """
    # Fetch MSME profile
    msme = await database.msmes.find_one({"msme_id": msme_id})
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    # Check if ML model is loaded
    if not ml_service.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="ML model not loaded. Please run the training script first."
        )

    # Run scoring
    try:
        score_result = ml_service.predict_score(msme)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")

    # Add metadata
    scored_at = datetime.now(timezone.utc).isoformat()
    score_record = {
        "msme_id": msme_id,
        "business_name": msme["business_name"],
        **score_result,
        "scored_at": scored_at,
    }

    # Save to scores collection
    await database.scores.insert_one(score_record.copy())

    # Update latest score on MSME profile
    await database.msmes.update_one(
        {"msme_id": msme_id},
        {"$set": {
            "latest_score": score_result["overall_score"],
            "risk_tier": score_result["risk_tier"]["label"],
            "last_scored_at": scored_at,
        }}
    )

    return score_record


@router.get("/{msme_id}")
async def get_latest_score(msme_id: str, user=Depends(get_current_user)):
    """Get the most recent score for an MSME."""
    scores = await database.scores.find({"msme_id": msme_id}).sort(
        "scored_at", -1
    ).to_list(length=1)

    if not scores:
        raise HTTPException(status_code=404, detail="No scores found for this MSME")

    score = scores[0]
    score.pop("_id", None)
    return score


@router.get("/{msme_id}/history")
async def get_score_history(msme_id: str, user=Depends(get_current_user)):
    """Get score history for an MSME (all past scores)."""
    msme = await database.msmes.find_one({"msme_id": msme_id})
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    scores = await database.scores.find({"msme_id": msme_id}).sort(
        "scored_at", -1
    ).to_list(length=50)

    history = []
    for s in scores:
        s.pop("_id", None)
        history.append({
            "overall_score": s["overall_score"],
            "risk_tier": s["risk_tier"],
            "scored_at": s["scored_at"],
            "sub_scores": s.get("sub_scores"),
        })

    return {
        "msme_id": msme_id,
        "business_name": msme["business_name"],
        "history": history,
    }
