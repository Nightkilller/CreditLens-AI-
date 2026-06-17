"""
CreditLens AI — Score Calculator
==================================
Converts raw model predictions and SHAP explanations into the
Financial Health Card format:
  - Overall score: 0-100
  - Sub-scores: Liquidity, Stability, Growth, Compliance (each 0-100)
  - Risk tier: Healthy / Moderate / High Risk

Scoring Methodology:
    Overall Score = (1 - P(default)) × 100
    This directly maps the model's confidence in non-default to a 0-100 scale.

    Sub-scores are derived by grouping SHAP values into 4 credit pillars
    and normalizing them to 0-100 scale. The grouped SHAP values represent
    each pillar's contribution to the overall score relative to the base rate.

Usage:
    from score_calculator import ScoreCalculator
    calculator = ScoreCalculator()
    result = calculator.calculate(default_probability, shap_explanation)
"""

import numpy as np


# ─── Risk Tier Definitions ────────────────────────────────────────
RISK_TIERS = {
    "healthy": {"min": 75, "max": 100, "label": "Healthy", "color": "#1F9D55"},
    "moderate": {"min": 50, "max": 74, "label": "Moderate Risk", "color": "#E5A93B"},
    "high": {"min": 0, "max": 49, "label": "High Risk", "color": "#D6453D"},
}

# Sub-score pillar weights (should sum to 1.0)
# These weights reflect relative importance in MSME creditworthiness
PILLAR_WEIGHTS = {
    "liquidity": 0.30,   # Cash availability — most critical for debt servicing
    "stability": 0.25,   # Income consistency — predictability of repayment
    "growth": 0.25,      # Business trajectory — future viability
    "compliance": 0.20,  # Regulatory adherence — operational maturity
}


class ScoreCalculator:
    """
    Calculates the Financial Health Card scores from model output.

    The overall score is directly derived from the default probability.
    Sub-scores are derived from grouped SHAP values, normalized to 0-100.
    """

    def __init__(self):
        self.risk_tiers = RISK_TIERS
        self.pillar_weights = PILLAR_WEIGHTS

    def calculate(self, default_probability: float, shap_explanation: dict) -> dict:
        """
        Calculate all scores from model prediction and SHAP explanation.

        Args:
            default_probability: P(default) from XGBoost (0.0 to 1.0)
            shap_explanation: Output from ShapExplainer.explain_prediction()

        Returns:
            Dictionary with overall_score, sub_scores, risk_tier, and metadata
        """
        # ─── Overall Score ────────────────────────────────────
        # Simple inversion: high P(default) = low score
        overall_score = round((1 - default_probability) * 100, 1)
        overall_score = max(0, min(100, overall_score))

        # ─── Risk Tier ────────────────────────────────────────
        risk_tier = self._get_risk_tier(overall_score)

        # ─── Sub-Scores from Grouped SHAP ─────────────────────
        grouped_shap = shap_explanation.get("grouped_shap", {})
        sub_scores = self._calculate_sub_scores(grouped_shap, overall_score)

        # ─── Format Top Factors ───────────────────────────────
        top_factors = shap_explanation.get("top_factors", [])

        return {
            "overall_score": overall_score,
            "risk_tier": risk_tier,
            "sub_scores": sub_scores,
            "top_factors": top_factors,
            "default_probability": round(default_probability, 4),
        }

    def _get_risk_tier(self, score: float) -> dict:
        """Map overall score to risk tier."""
        if score >= 75:
            return RISK_TIERS["healthy"]
        elif score >= 50:
            return RISK_TIERS["moderate"]
        else:
            return RISK_TIERS["high"]

    def _calculate_sub_scores(self, grouped_shap: dict, overall_score: float) -> dict:
        """
        Calculate sub-scores from grouped SHAP values.

        Strategy:
        1. The grouped_shap values represent each pillar's net contribution
           to reducing default probability (positive = good for credit).
        2. We center each pillar score around the overall score, then adjust
           based on the pillar's relative SHAP contribution.
        3. The adjustment magnitude is scaled to create meaningful variation
           between pillars without producing extreme outliers.
        """
        if not grouped_shap:
            # Fallback: all sub-scores equal to overall score
            return {
                pillar: {
                    "score": overall_score,
                    "label": pillar.capitalize(),
                    "tier": self._get_risk_tier(overall_score),
                    "weight": self.pillar_weights[pillar],
                }
                for pillar in self.pillar_weights
            }

        # Normalize SHAP values to create relative adjustments
        shap_vals = np.array([grouped_shap.get(pillar, 0) for pillar in self.pillar_weights])

        # Scale factor: how much to spread sub-scores around overall score
        # Larger = more variation between pillars
        spread_factor = 30

        # Center around overall score, adjust by normalized SHAP
        if np.std(shap_vals) > 0:
            normalized = (shap_vals - np.mean(shap_vals)) / np.std(shap_vals)
        else:
            normalized = np.zeros_like(shap_vals)

        sub_scores = {}
        for i, pillar in enumerate(self.pillar_weights):
            pillar_score = overall_score + normalized[i] * spread_factor
            pillar_score = round(max(0, min(100, pillar_score)), 1)

            sub_scores[pillar] = {
                "score": pillar_score,
                "label": pillar.capitalize(),
                "tier": self._get_risk_tier(pillar_score),
                "weight": self.pillar_weights[pillar],
            }

        return sub_scores

    def format_for_api(self, score_result: dict) -> dict:
        """
        Format score result for API response (clean JSON serialization).
        """
        return {
            "overall_score": score_result["overall_score"],
            "risk_tier": {
                "label": score_result["risk_tier"]["label"],
                "color": score_result["risk_tier"]["color"],
            },
            "sub_scores": {
                pillar: {
                    "score": data["score"],
                    "label": data["label"],
                    "tier_label": data["tier"]["label"],
                    "tier_color": data["tier"]["color"],
                    "weight": data["weight"],
                }
                for pillar, data in score_result["sub_scores"].items()
            },
            "top_factors": [
                {
                    "feature": f["display_name"],
                    "impact": round(f["impact"], 3),
                    "direction": f["direction"],
                    "group": f["group"],
                }
                for f in score_result["top_factors"]
            ],
            "default_probability": score_result["default_probability"],
        }
