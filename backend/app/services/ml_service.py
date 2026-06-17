"""
CreditLens AI — ML Service
=============================
Loads the trained XGBoost model, scaler, and SHAP explainer at startup.
Provides scoring functions called by the API routes.
"""

import json
import sys
import numpy as np
import pandas as pd
from pathlib import Path

try:
    import xgboost as xgb
except ImportError:
    xgb = None
import joblib

# Add ML engine to path
ML_ENGINE_PATH = Path(__file__).parent.parent.parent.parent / "ml-engine"
sys.path.insert(0, str(ML_ENGINE_PATH))

from training.feature_engineering import prepare_single_profile, MODEL_FEATURES, FEATURE_DISPLAY_NAMES
from explainability.shap_explainer import ShapExplainer
from scoring.score_calculator import ScoreCalculator


class MLService:
    """
    Singleton service that manages the ML model lifecycle.
    Loaded once at application startup, used for all scoring requests.
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.explainer = None
        self.score_calculator = None
        self.is_loaded = False

    def load(self, artifacts_dir: str = None):
        """Load all model artifacts from disk."""
        if artifacts_dir is None:
            artifacts_dir = ML_ENGINE_PATH / "training" / "model_artifacts"
        else:
            artifacts_dir = Path(artifacts_dir)

        try:
            xgb_model_path = artifacts_dir / "xgb_model.json"
            rf_model_path = artifacts_dir / "rf_model.pkl"

            # Load feature names
            with open(artifacts_dir / "feature_names.json") as f:
                self.feature_names = json.load(f)
            print(f"  ✅ Loaded feature names ({len(self.feature_names)} features)")

            # Load scaler
            self.scaler = joblib.load(artifacts_dir / "scaler.pkl")
            print(f"  ✅ Loaded feature scaler")

            if xgb is not None and xgb_model_path.exists():
                # Load XGBoost model
                self.model = xgb.XGBClassifier()
                self.model.load_model(str(xgb_model_path))
                print(f"  ✅ Loaded XGBoost model")
            elif rf_model_path.exists():
                # Load RandomForest model
                self.model = joblib.load(rf_model_path)
                print(f"  ✅ Loaded RandomForest model (fallback)")
            else:
                raise FileNotFoundError(f"Neither {xgb_model_path.name} nor {rf_model_path.name} was found in {artifacts_dir}.")

            # Initialize SHAP explainer
            self.explainer = ShapExplainer(self.model, self.feature_names)
            print(f"  ✅ Initialized SHAP explainer wrapper")

            # Initialize score calculator
            self.score_calculator = ScoreCalculator()
            print(f"  ✅ Initialized score calculator")

            self.is_loaded = True
            print(f"  ✅ ML service fully loaded")

        except Exception as e:
            print(f"  ❌ Failed to load ML model: {e}")
            print(f"     Run 'python ml-engine/training/train_model.py' first")
            self.is_loaded = False

    def predict_score(self, msme_data: dict) -> dict:
        """
        Score a single MSME profile.

        Args:
            msme_data: Dictionary with raw MSME profile fields

        Returns:
            Formatted score result ready for API response
        """
        if not self.is_loaded:
            raise RuntimeError("ML model not loaded. Run train_model.py first.")

        # Prepare features
        X = prepare_single_profile(msme_data, self.scaler)

        # Get default probability
        default_prob = float(self.model.predict_proba(X)[0, 1])

        # Get SHAP explanation
        explanation = self.explainer.explain_prediction(X, top_n=5)

        # Calculate scores
        score_result = self.score_calculator.calculate(default_prob, explanation)

        # Format for API
        formatted = self.score_calculator.format_for_api(score_result)

        return formatted


# Singleton instance
ml_service = MLService()
