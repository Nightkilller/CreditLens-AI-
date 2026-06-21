"""
CreditLens AI — Model Training
================================
Trains an XGBoost classifier on engineered MSME features to predict
default probability. Saves model artifacts for inference.

Usage:
    python train_model.py

Outputs:
    - model_artifacts/xgb_model.json          (XGBoost model)
    - model_artifacts/scaler.pkl              (StandardScaler)
    - model_artifacts/feature_names.json      (ordered feature list)
    - model_artifacts/training_metrics.json   (performance metrics)
"""

import json
import sys
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import (
    accuracy_score, roc_auc_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    from sklearn.ensemble import RandomForestClassifier
import joblib

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from training.feature_engineering import prepare_features, MODEL_FEATURES

# ─── Paths ────────────────────────────────────────────────────────
DATA_PATH = Path(__file__).parent.parent / "data" / "generated_dataset.csv"
ARTIFACTS_DIR = Path(__file__).parent / "model_artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)


def train():
    """Train XGBoost classifier and save all artifacts."""

    print("=" * 70)
    print("  CreditLens AI — Model Training")
    print("=" * 70)

    # ─── 1. Load Data ─────────────────────────────────────────
    print("\n[1/5] Loading data...")
    df = pd.read_csv(DATA_PATH)
    print(f"  Loaded {len(df)} records")
    print(f"  Default rate: {df['defaulted_label'].mean():.1%}")

    # ─── 2. Feature Engineering ───────────────────────────────
    print("\n[2/5] Engineering features...")
    X, y, feature_names, scaler = prepare_features(df, fit=True)
    print(f"  Feature matrix: {X.shape}")
    print(f"  Features: {len(feature_names)}")

    # ─── 3. Train-Test Split ──────────────────────────────────
    print("\n[3/5] Splitting data (80/20, stratified)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"  Train: {X_train.shape[0]} samples (default rate: {y_train.mean():.1%})")
    print(f"  Test:  {X_test.shape[0]} samples (default rate: {y_test.mean():.1%})")

    # ─── 4. Train Classifier (Direct Fit for Instant Deployment) ───
    if XGBOOST_AVAILABLE:
        print("\n[4/5] Training XGBoost classifier...")

        # Calculate scale_pos_weight for class imbalance
        n_neg = np.sum(y_train == 0)
        n_pos = np.sum(y_train == 1)
        scale_pos_weight = n_neg / n_pos
        print(f"  Class imbalance ratio: {scale_pos_weight:.1f}:1 (scale_pos_weight)")

        best_model = xgb.XGBClassifier(
            scale_pos_weight=scale_pos_weight,
            objective="binary:logistic",
            eval_metric="auc",
            random_state=42,
            max_depth=6,
            n_estimators=150,
            learning_rate=0.1,
            min_child_weight=3,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
        )

        best_model.fit(X_train, y_train)
        best_params = {"max_depth": 6, "n_estimators": 150, "learning_rate": 0.1}
        cv_auc_roc = roc_auc_score(y_train, best_model.predict_proba(X_train)[:, 1])
        print(f"  Train AUC-ROC: {cv_auc_roc:.4f}")
    else:
        print("\n[4/5] Training RandomForest classifier (XGBoost unavailable)...")

        best_model = RandomForestClassifier(
            class_weight="balanced",
            max_depth=6,
            n_estimators=150,
            random_state=42,
            n_jobs=-1
        )

        best_model.fit(X_train, y_train)
        best_params = {"max_depth": 6, "n_estimators": 150}
        cv_auc_roc = roc_auc_score(y_train, best_model.predict_proba(X_train)[:, 1])
        print(f"  Train AUC-ROC: {cv_auc_roc:.4f}")

    # ─── 5. Evaluate ──────────────────────────────────────────
    print("\n[5/5] Evaluating on test set...")

    y_pred = best_model.predict(X_test)
    y_pred_proba = best_model.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    auc_roc = roc_auc_score(y_test, y_pred_proba)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)

    print(f"\n  {'─' * 40}")
    print(f"  Test Set Performance Metrics")
    print(f"  {'─' * 40}")
    print(f"  Accuracy:  {accuracy:.4f}")
    print(f"  AUC-ROC:   {auc_roc:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    print(f"\n  Confusion Matrix:")
    print(f"                 Predicted")
    print(f"                  No   Yes")
    print(f"  Actual  No   [{cm[0, 0]:4d}  {cm[0, 1]:4d}]")
    print(f"          Yes  [{cm[1, 0]:4d}  {cm[1, 1]:4d}]")

    print(f"\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["No Default", "Default"]))

    # ─── Feature Importance ───────────────────────────────────
    print(f"  {'─' * 40}")
    print(f"  Feature Importance (gain)")
    print(f"  {'─' * 40}")

    importance = best_model.feature_importances_
    sorted_idx = np.argsort(importance)[::-1]
    for i in sorted_idx:
        bar_len = int(importance[i] * 50)
        bar = "█" * bar_len
        print(f"  {feature_names[i]:40s} {importance[i]:.4f}  {bar}")

    # ─── Save Artifacts ───────────────────────────────────────
    print(f"\n  Saving model artifacts to {ARTIFACTS_DIR}/...")

    if XGBOOST_AVAILABLE:
        # Save XGBoost model
        model_path = ARTIFACTS_DIR / "xgb_model.json"
        best_model.save_model(str(model_path))
        print(f"  ✅ XGBoost Model → {model_path.name}")
    else:
        # Save RandomForest model
        model_path = ARTIFACTS_DIR / "rf_model.pkl"
        joblib.dump(best_model, model_path)
        print(f"  ✅ RandomForest Model → {model_path.name}")

    # Save scaler
    scaler_path = ARTIFACTS_DIR / "scaler.pkl"
    joblib.dump(scaler, scaler_path)
    print(f"  ✅ Scaler → {scaler_path.name}")

    # Save feature names
    features_path = ARTIFACTS_DIR / "feature_names.json"
    with open(features_path, "w") as f:
        json.dump(feature_names, f, indent=2)
    print(f"  ✅ Feature names → {features_path.name}")

    # Save training metrics
    metrics = {
        "accuracy": float(accuracy),
        "auc_roc": float(auc_roc),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "confusion_matrix": cm.tolist(),
        "best_params": best_params,
        "cv_auc_roc": float(cv_auc_roc),
        "train_size": int(X_train.shape[0]),
        "test_size": int(X_test.shape[0]),
        "default_rate": float(y.mean()),
        "n_features": len(feature_names),
    }
    metrics_path = ARTIFACTS_DIR / "training_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  ✅ Metrics → {metrics_path.name}")

    print(f"\n{'=' * 70}")
    print(f"  Training complete!")
    print(f"{'=' * 70}\n")

    return best_model, scaler, feature_names, metrics


if __name__ == "__main__":
    train()
