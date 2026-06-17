"""
CreditLens AI — Pydantic Models for Score Responses
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RiskTier(BaseModel):
    label: str
    color: str


class SubScore(BaseModel):
    score: float
    label: str
    tier_label: str
    tier_color: str
    weight: float


class TopFactor(BaseModel):
    feature: str
    impact: float
    direction: str  # "positive" or "negative"
    group: str


class ScoreResponse(BaseModel):
    """Full score response returned by the scoring API."""
    msme_id: str
    business_name: str
    overall_score: float
    risk_tier: RiskTier
    sub_scores: dict[str, SubScore]
    top_factors: list[TopFactor]
    default_probability: float
    scored_at: str  # ISO format timestamp


class ScoreHistoryItem(BaseModel):
    overall_score: float
    risk_tier: RiskTier
    scored_at: str
    sub_scores: Optional[dict[str, SubScore]] = None


class ScoreHistoryResponse(BaseModel):
    msme_id: str
    business_name: str
    history: list[ScoreHistoryItem]
