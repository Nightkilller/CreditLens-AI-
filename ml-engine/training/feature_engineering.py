"""
CreditLens AI — Feature Engineering
=====================================
Transforms raw MSME profile fields into model-ready features.
Handles derived features, encoding, and scaling.

Usage:
    from feature_engineering import prepare_features
    X, y, feature_names, scaler = prepare_features(df)
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from pathlib import Path


# ─── Feature Group Definitions ────────────────────────────────────
# These groups are used by the score_calculator to compute sub-scores.
# Each feature is assigned to exactly one credit pillar.

FEATURE_GROUPS = {
    "liquidity": [
        "avg_monthly_bank_balance_log",
        "cash_flow_to_emi_ratio_log",
        "net_upi_flow_log",
        "emi_burden_ratio",
    ],
    "stability": [
        "inflow_volatility_score",
        "emi_bounce_count_12m",
        "upi_inflow_per_customer_log",
        "years_in_operation",
    ],
    "growth": [
        "gst_turnover_growth_yoy_pct",
        "employee_count_trend_12m",
        "upi_transaction_count_monthly_log",
        "employee_count_log",
    ],
    "compliance": [
        "gst_filing_regularity_pct",
        "input_tax_credit_claimed_pct",
        "epfo_contribution_regularity_pct",
        "workforce_formality_ratio",
        "gst_compliance_composite",
    ],
}

# All features used by the model (in order)
MODEL_FEATURES = [f for group in FEATURE_GROUPS.values() for f in group]

# Human-readable display names for SHAP explanations
FEATURE_DISPLAY_NAMES = {
    "avg_monthly_bank_balance_log": "Average Bank Balance",
    "cash_flow_to_emi_ratio_log": "Cash Flow to EMI Ratio",
    "net_upi_flow_log": "Net UPI Cash Flow",
    "emi_burden_ratio": "EMI Burden Ratio",
    "inflow_volatility_score": "Income Volatility",
    "emi_bounce_count_12m": "EMI Bounces (12 months)",
    "upi_inflow_per_customer_log": "Revenue per Customer",
    "years_in_operation": "Years in Operation",
    "gst_turnover_growth_yoy_pct": "Turnover Growth (YoY)",
    "employee_count_trend_12m": "Workforce Growth Trend",
    "upi_transaction_count_monthly_log": "Transaction Volume",
    "employee_count_log": "Business Scale (Employees)",
    "gst_filing_regularity_pct": "GST Filing Regularity",
    "input_tax_credit_claimed_pct": "Input Tax Credit Usage",
    "epfo_contribution_regularity_pct": "EPFO Contribution Regularity",
    "workforce_formality_ratio": "Workforce Formality",
    "gst_compliance_composite": "GST Compliance Score",
}


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create derived features from raw MSME data.

    Returns a DataFrame with only the model features (in MODEL_FEATURES order).
    """
    feat = pd.DataFrame(index=df.index)

    # ─── Liquidity Features ───────────────────────────────
    # Log-transform monetary features to handle skewness
    feat["avg_monthly_bank_balance_log"] = np.log1p(df["avg_monthly_bank_balance"])
    feat["cash_flow_to_emi_ratio_log"] = np.log1p(df["cash_flow_to_emi_ratio"])

    # Net UPI flow: inflow - outflow (positive = healthy)
    net_upi = df["monthly_upi_inflow_avg"] - df["monthly_upi_outflow_avg"]
    # Use signed log: preserve sign, log of absolute value
    feat["net_upi_flow_log"] = np.sign(net_upi) * np.log1p(np.abs(net_upi))

    # EMI burden: ratio of EMI obligations to total inflow
    total_inflow = df["monthly_upi_inflow_avg"] + 1  # avoid div by zero
    feat["emi_burden_ratio"] = df["existing_emi_obligations_monthly"] / total_inflow

    # ─── Stability Features ───────────────────────────────
    feat["inflow_volatility_score"] = df["inflow_volatility_score"]
    feat["emi_bounce_count_12m"] = df["emi_bounce_count_12m"]

    # Revenue per customer (higher = less diversified but higher value)
    feat["upi_inflow_per_customer_log"] = np.log1p(
        df["monthly_upi_inflow_avg"] / (df["unique_customer_count_monthly"] + 1)
    )
    feat["years_in_operation"] = df["years_in_operation"]

    # ─── Growth Features ──────────────────────────────────
    feat["gst_turnover_growth_yoy_pct"] = df["gst_turnover_growth_yoy_pct"]
    feat["employee_count_trend_12m"] = df["employee_count_trend_12m"]
    feat["upi_transaction_count_monthly_log"] = np.log1p(df["upi_transaction_count_monthly"])
    feat["employee_count_log"] = np.log1p(df["employee_count"])

    # ─── Compliance Features ──────────────────────────────
    feat["gst_filing_regularity_pct"] = df["gst_filing_regularity_pct"]
    feat["input_tax_credit_claimed_pct"] = df["input_tax_credit_claimed_pct"]
    feat["epfo_contribution_regularity_pct"] = df["epfo_contribution_regularity_pct"]

    # Workforce formality: EPFO-registered / total employees
    feat["workforce_formality_ratio"] = df["epfo_employee_count"] / (df["employee_count"] + 1)

    # GST compliance composite: weighted average of filing regularity and ITC usage
    feat["gst_compliance_composite"] = (
        0.6 * df["gst_filing_regularity_pct"] +
        0.4 * df["input_tax_credit_claimed_pct"]
    )

    # Ensure column order matches MODEL_FEATURES
    feat = feat[MODEL_FEATURES]

    return feat


def prepare_features(df: pd.DataFrame, scaler: StandardScaler = None, fit: bool = True):
    """
    Full pipeline: engineer features → scale.

    Args:
        df: Raw MSME DataFrame (with all original columns)
        scaler: Optional pre-fitted scaler (for inference)
        fit: If True, fit the scaler on this data (training). If False, transform only.

    Returns:
        X: numpy array of scaled features
        y: numpy array of labels (if 'defaulted_label' exists in df, else None)
        feature_names: list of feature names (in order)
        scaler: fitted StandardScaler
    """
    # Engineer features
    feat_df = engineer_features(df)

    # Extract label if available
    y = None
    if "defaulted_label" in df.columns:
        y = df["defaulted_label"].values

    # Scale features
    if scaler is None:
        scaler = StandardScaler()

    if fit:
        X = scaler.fit_transform(feat_df.values)
    else:
        X = scaler.transform(feat_df.values)

    feature_names = list(feat_df.columns)

    return X, y, feature_names, scaler


def prepare_single_profile(profile_dict: dict, scaler: StandardScaler) -> np.ndarray:
    """
    Prepare features for a single MSME profile (used during inference).

    Args:
        profile_dict: Dictionary with raw MSME fields
        scaler: Pre-fitted StandardScaler

    Returns:
        Scaled feature array (1, n_features)
    """
    df = pd.DataFrame([profile_dict])
    feat_df = engineer_features(df)
    X = scaler.transform(feat_df.values)
    return X


if __name__ == "__main__":
    # Quick test: load generated data and prepare features
    data_path = Path(__file__).parent.parent / "data" / "generated_dataset.csv"
    df = pd.read_csv(data_path)

    X, y, feature_names, scaler = prepare_features(df)

    print(f"Feature matrix shape: {X.shape}")
    print(f"Label distribution: {np.bincount(y)}")
    print(f"\nFeatures ({len(feature_names)}):")
    for i, name in enumerate(feature_names):
        print(f"  [{i:2d}] {name:45s} mean={X[:, i].mean():+.3f}  std={X[:, i].std():.3f}")
