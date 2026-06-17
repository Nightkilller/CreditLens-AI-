"""
CreditLens AI — Synthetic MSME Data Generator
===============================================
Generates 2,000 realistic synthetic MSME profiles with alternate data features
(GST, UPI, Account Aggregator/Bank Cash Flow, EPFO) and a supervised default
label that has learnable signal for model training.

Distributions are calibrated to resemble published statistics from
RBI, SIDBI, NPCI, and GSTN for Indian MSMEs.

Usage:
    python synthetic_generator.py

Output:
    - generated_dataset.csv (2,000 rows × 22 columns + derived fields)
    - Summary statistics printed to console
"""

import uuid
import random
import numpy as np
import pandas as pd
from pathlib import Path

# ─── Reproducibility ─────────────────────────────────────────────
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

NUM_RECORDS = 2000

# ─── Business Name Components ────────────────────────────────────
# Common Indian surnames and business type suffixes for realistic naming
SURNAMES = [
    "Sharma", "Patel", "Gupta", "Singh", "Kumar", "Agarwal", "Jain", "Mehta",
    "Shah", "Verma", "Reddy", "Rao", "Nair", "Iyer", "Pillai", "Desai",
    "Joshi", "Mishra", "Pandey", "Tiwari", "Choudhary", "Yadav", "Dubey",
    "Sinha", "Bansal", "Goel", "Mittal", "Kapoor", "Bhatia", "Malhotra",
    "Rathi", "Agrawal", "Saxena", "Khanna", "Bajaj", "Chopra", "Sethi",
    "Rastogi", "Thakur", "Bose", "Ghosh", "Das", "Mukherjee", "Chatterjee",
    "Sawant", "Kulkarni", "Patil", "Bhatt", "Vyas", "Trivedi"
]

BUSINESS_SUFFIXES = {
    "Manufacturing": ["Industries", "Manufacturing", "Works", "Fabrication", "Enterprises", "Products", "Engineering"],
    "Retail": ["Stores", "Mart", "Retail", "Traders", "Emporium", "Collection", "Shop"],
    "Services": ["Services", "Solutions", "Consultants", "Associates", "Agency", "Tech", "Digital"],
    "Trading": ["Trading Co.", "Traders", "Exports", "Imports", "Commodities", "Distributors", "Supply Co."],
    "Agriculture-allied": ["Agro", "Farms", "Seeds", "Agri Products", "Dairy", "Foods", "Organics"],
    "Textiles": ["Textiles", "Fabrics", "Garments", "Apparels", "Weaves", "Fashion", "Silk House"]
}

# ─── Sector Distribution ─────────────────────────────────────────
# Based on MSME ministry annual reports — manufacturing and services dominate
SECTORS = ["Manufacturing", "Retail", "Services", "Trading", "Agriculture-allied", "Textiles"]
SECTOR_WEIGHTS = [0.25, 0.20, 0.20, 0.15, 0.10, 0.10]

# ─── State Distribution ──────────────────────────────────────────
# Weighted toward MSME-dense states (based on Udyam registration data)
STATES = [
    "Maharashtra", "Gujarat", "Uttar Pradesh", "Tamil Nadu", "Madhya Pradesh",
    "Rajasthan", "Karnataka", "West Bengal", "Telangana", "Kerala",
    "Andhra Pradesh", "Punjab", "Haryana", "Bihar", "Odisha",
    "Delhi", "Jharkhand", "Chhattisgarh", "Assam", "Uttarakhand"
]
STATE_WEIGHTS = [
    0.18, 0.13, 0.11, 0.10, 0.08,
    0.06, 0.06, 0.05, 0.04, 0.03,
    0.03, 0.03, 0.02, 0.02, 0.02,
    0.01, 0.01, 0.01, 0.005, 0.005
]


def generate_business_name(sector: str) -> str:
    """Generate a plausible Indian MSME business name."""
    surname = random.choice(SURNAMES)
    suffix = random.choice(BUSINESS_SUFFIXES[sector])
    return f"{surname} {suffix}"


def generate_profiles(n: int = NUM_RECORDS) -> pd.DataFrame:
    """
    Generate n synthetic MSME profiles with realistic distributions.

    The generation logic creates correlations between features that mirror
    real-world MSME behavior (e.g., larger firms have more UPI transactions,
    well-run firms have better GST compliance AND lower bounce rates, etc.)
    """
    records = []

    for _ in range(n):
        # ─── Identity / Meta ──────────────────────────────────
        sector = np.random.choice(SECTORS, p=SECTOR_WEIGHTS)
        state = np.random.choice(STATES, p=STATE_WEIGHTS)

        # Years in operation: right-skewed (many young MSMEs, few old ones)
        years_in_operation = round(np.random.lognormal(mean=1.5, sigma=0.7), 1)
        years_in_operation = np.clip(years_in_operation, 0.5, 25.0)

        # Employee count: log-normal, sector-dependent
        emp_base = {"Manufacturing": 3.0, "Retail": 1.8, "Services": 2.0,
                    "Trading": 1.5, "Agriculture-allied": 1.8, "Textiles": 2.5}
        employee_count = int(np.random.lognormal(mean=emp_base[sector], sigma=0.8))
        employee_count = np.clip(employee_count, 1, 200)

        # ─── Underlying "business quality" latent variable ────
        # This creates realistic correlations: a well-run business tends to
        # be good across multiple dimensions simultaneously
        business_quality = np.random.beta(2.5, 2.5)  # 0-1, centered around 0.5

        # ─── GST Features ─────────────────────────────────────
        # GST filing regularity: higher for better-run businesses
        gst_filing_regularity_pct = np.clip(
            business_quality * 70 + np.random.normal(20, 10), 0, 100
        )

        # Monthly GST turnover: log-normal, correlated with employee count and sector
        turnover_base = np.log(employee_count * 50000 + 10000)
        monthly_gst_turnover_avg = np.exp(
            np.random.normal(turnover_base, 0.5)
        )
        monthly_gst_turnover_avg = np.clip(monthly_gst_turnover_avg, 10000, 50000000)

        # YoY turnover growth: normally distributed with slight positive skew
        gst_turnover_growth_yoy_pct = np.random.normal(
            8 + business_quality * 15, 20
        )
        gst_turnover_growth_yoy_pct = np.clip(gst_turnover_growth_yoy_pct, -40, 80)

        # Input Tax Credit claimed: proxy for compliance sophistication
        input_tax_credit_claimed_pct = np.clip(
            business_quality * 60 + np.random.normal(25, 12), 0, 100
        )

        # ─── UPI / Transaction Features ───────────────────────
        # UPI inflow correlates with GST turnover (digital adoption factor)
        digital_adoption = np.random.beta(3, 2)  # higher = more digital
        monthly_upi_inflow_avg = monthly_gst_turnover_avg * digital_adoption * np.random.uniform(0.3, 0.9)
        monthly_upi_inflow_avg = np.clip(monthly_upi_inflow_avg, 5000, 40000000)

        # Outflow: correlated with inflow (60-90% + noise)
        outflow_ratio = np.random.uniform(0.6, 0.92)
        monthly_upi_outflow_avg = monthly_upi_inflow_avg * outflow_ratio + np.random.normal(0, monthly_upi_inflow_avg * 0.05)
        monthly_upi_outflow_avg = np.clip(monthly_upi_outflow_avg, 0, monthly_upi_inflow_avg * 1.1)

        # Transaction count: correlated with inflow magnitude
        upi_transaction_count_monthly = int(
            np.clip(monthly_upi_inflow_avg / np.random.uniform(1000, 15000), 10, 5000)
        )

        # Unique customers: fewer = more concentrated risk
        customer_concentration = np.random.beta(2, 3)
        unique_customer_count_monthly = int(
            np.clip(upi_transaction_count_monthly * customer_concentration, 1, upi_transaction_count_monthly * 0.8)
        )
        unique_customer_count_monthly = max(1, unique_customer_count_monthly)

        # Inflow volatility: inverse of business stability
        inflow_volatility_score = np.clip(
            (1 - business_quality) * 0.5 + np.random.normal(0.15, 0.1), 0, 1
        )

        # ─── Account Aggregator (Bank Cash Flow) Features ─────
        # Average monthly bank balance: correlated with turnover and quality
        avg_monthly_bank_balance = monthly_gst_turnover_avg * np.random.uniform(0.1, 0.5) * (0.5 + business_quality * 0.5)
        avg_monthly_bank_balance = np.clip(avg_monthly_bank_balance, 5000, 20000000)

        # EMI bounce count: inversely correlated with business quality
        emi_bounce_prob = (1 - business_quality) * 0.15  # max ~15% per month for worst businesses
        emi_bounce_count_12m = np.random.binomial(12, emi_bounce_prob)
        emi_bounce_count_12m = np.clip(emi_bounce_count_12m, 0, 12)

        # Existing EMI obligations: up to 50% of inflow for leveraged businesses
        leverage_factor = np.random.beta(2, 4)  # most businesses have moderate leverage
        existing_emi_obligations_monthly = monthly_upi_inflow_avg * leverage_factor * 0.4
        existing_emi_obligations_monthly = np.clip(existing_emi_obligations_monthly, 0, 500000)

        # Cash flow to EMI ratio (derived)
        if existing_emi_obligations_monthly > 0:
            cash_flow_to_emi_ratio = avg_monthly_bank_balance / existing_emi_obligations_monthly
        else:
            cash_flow_to_emi_ratio = 10.0  # no EMI obligations = very safe
        cash_flow_to_emi_ratio = np.clip(cash_flow_to_emi_ratio, 0, 50)

        # ─── EPFO Features ────────────────────────────────────
        # EPFO employee count: loosely correlated with actual employee count
        # Many MSMEs have informal workers not covered by EPFO
        formality_ratio = np.random.beta(2 + business_quality * 3, 3)
        epfo_employee_count = int(employee_count * formality_ratio)
        epfo_employee_count = max(0, epfo_employee_count)

        # EPFO contribution regularity: correlated with business quality
        epfo_contribution_regularity_pct = np.clip(
            business_quality * 65 + np.random.normal(20, 12), 0, 100
        )

        # Employee count trend: slight growth bias for healthy businesses
        employee_count_trend_12m = np.random.normal(
            business_quality * 20 - 5, 12
        )
        employee_count_trend_12m = np.clip(employee_count_trend_12m, -30, 50)

        records.append({
            "msme_id": str(uuid.uuid4()),
            "business_name": generate_business_name(sector),
            "sector": sector,
            "years_in_operation": years_in_operation,
            "employee_count": int(employee_count),
            "state": state,
            # GST
            "gst_filing_regularity_pct": round(gst_filing_regularity_pct, 1),
            "monthly_gst_turnover_avg": round(monthly_gst_turnover_avg, 0),
            "gst_turnover_growth_yoy_pct": round(gst_turnover_growth_yoy_pct, 1),
            "input_tax_credit_claimed_pct": round(input_tax_credit_claimed_pct, 1),
            # UPI
            "monthly_upi_inflow_avg": round(monthly_upi_inflow_avg, 0),
            "monthly_upi_outflow_avg": round(monthly_upi_outflow_avg, 0),
            "upi_transaction_count_monthly": int(upi_transaction_count_monthly),
            "unique_customer_count_monthly": int(unique_customer_count_monthly),
            "inflow_volatility_score": round(inflow_volatility_score, 3),
            # AA / Bank
            "avg_monthly_bank_balance": round(avg_monthly_bank_balance, 0),
            "emi_bounce_count_12m": int(emi_bounce_count_12m),
            "existing_emi_obligations_monthly": round(existing_emi_obligations_monthly, 0),
            "cash_flow_to_emi_ratio": round(cash_flow_to_emi_ratio, 2),
            # EPFO
            "epfo_employee_count": int(epfo_employee_count),
            "epfo_contribution_regularity_pct": round(epfo_contribution_regularity_pct, 1),
            "employee_count_trend_12m": round(employee_count_trend_12m, 1),
            # Latent (used for label generation, can be dropped before training)
            "_business_quality": round(business_quality, 4),
        })

    df = pd.DataFrame(records)

    # ─── Generate Default Label ───────────────────────────────────
    # Weighted logistic function that creates learnable signal.
    # Higher risk score → higher probability of default.
    # Target: ~8-12% positive class (matching real MSME NPA rates from RBI data).
    df["_risk_score"] = (
        # LOW GST regularity increases default probability
        -0.03 * df["gst_filing_regularity_pct"]
        # HIGH EMI bounces strongly increase default probability
        + 0.35 * df["emi_bounce_count_12m"]
        # HIGH inflow volatility increases default probability
        + 2.5 * df["inflow_volatility_score"]
        # DECLINING employee trend increases default probability
        - 0.04 * df["employee_count_trend_12m"]
        # LOW bank balance relative to EMI increases default probability
        - 0.15 * np.log1p(df["cash_flow_to_emi_ratio"])
        # LOW EPFO contribution regularity increases default probability
        - 0.02 * df["epfo_contribution_regularity_pct"]
        # LOW ITC claimed indicates unsophisticated compliance
        - 0.01 * df["input_tax_credit_claimed_pct"]
        # NEGATIVE turnover growth is a risk signal
        - 0.02 * df["gst_turnover_growth_yoy_pct"]
        # Fewer years in operation = higher risk (thin file)
        - 0.08 * df["years_in_operation"]
    )

    # Apply sigmoid to convert risk score to probability
    # Calibrate intercept to achieve ~10% default rate
    intercept = -0.1  # tuned to hit ~10% default rate
    default_prob = 1 / (1 + np.exp(-(df["_risk_score"] + intercept)))

    # Add noise so it's not a perfect function (realistic)
    default_prob = np.clip(default_prob + np.random.normal(0, 0.03, len(df)), 0.01, 0.99)

    # Generate binary label from probability
    df["defaulted_label"] = (np.random.random(len(df)) < default_prob).astype(int)

    # Drop internal columns
    df = df.drop(columns=["_business_quality", "_risk_score"])

    return df


def print_summary(df: pd.DataFrame):
    """Print comprehensive summary statistics for sanity checking."""
    print("\n" + "=" * 70)
    print("  CreditLens AI — Synthetic Dataset Summary")
    print("=" * 70)

    print(f"\n📊 Total records: {len(df)}")
    print(f"📊 Default rate:  {df['defaulted_label'].mean():.1%}  "
          f"({df['defaulted_label'].sum()} defaults / {len(df)} total)")

    print(f"\n{'─' * 70}")
    print("SECTOR DISTRIBUTION")
    print(f"{'─' * 70}")
    sector_counts = df["sector"].value_counts()
    for sector, count in sector_counts.items():
        default_rate = df[df["sector"] == sector]["defaulted_label"].mean()
        print(f"  {sector:25s} {count:5d} ({count/len(df)*100:5.1f}%)  "
              f"Default rate: {default_rate:.1%}")

    print(f"\n{'─' * 70}")
    print("STATE DISTRIBUTION (top 10)")
    print(f"{'─' * 70}")
    state_counts = df["state"].value_counts().head(10)
    for state, count in state_counts.items():
        print(f"  {state:25s} {count:5d} ({count/len(df)*100:5.1f}%)")

    print(f"\n{'─' * 70}")
    print("KEY FEATURE STATISTICS")
    print(f"{'─' * 70}")

    key_cols = [
        "years_in_operation", "employee_count",
        "gst_filing_regularity_pct", "monthly_gst_turnover_avg",
        "gst_turnover_growth_yoy_pct", "input_tax_credit_claimed_pct",
        "monthly_upi_inflow_avg", "monthly_upi_outflow_avg",
        "upi_transaction_count_monthly", "unique_customer_count_monthly",
        "inflow_volatility_score",
        "avg_monthly_bank_balance", "emi_bounce_count_12m",
        "existing_emi_obligations_monthly", "cash_flow_to_emi_ratio",
        "epfo_employee_count", "epfo_contribution_regularity_pct",
        "employee_count_trend_12m",
    ]

    stats = df[key_cols].describe().T[["mean", "std", "min", "25%", "50%", "75%", "max"]]
    for col in stats.index:
        row = stats.loc[col]
        print(f"\n  {col}")
        print(f"    Mean: {row['mean']:>12,.1f}  |  Std: {row['std']:>10,.1f}  |  "
              f"Min: {row['min']:>10,.1f}  |  Max: {row['max']:>10,.1f}")
        print(f"    P25:  {row['25%']:>12,.1f}  |  P50: {row['50%']:>10,.1f}  |  "
              f"P75: {row['75%']:>10,.1f}")

    # Show correlation between features and default label
    print(f"\n{'─' * 70}")
    print("FEATURE CORRELATION WITH DEFAULT LABEL")
    print(f"{'─' * 70}")
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    numeric_cols = [c for c in numeric_cols if c != "defaulted_label"]
    correlations = df[numeric_cols].corrwith(df["defaulted_label"]).sort_values()
    for col, corr in correlations.items():
        direction = "↑ risk" if corr > 0 else "↓ risk"
        bar_len = int(abs(corr) * 40)
        bar = "█" * bar_len
        print(f"  {col:40s} {corr:+.3f}  {bar} {direction}")

    print(f"\n{'=' * 70}")
    print("  Dataset generation complete!")
    print(f"{'=' * 70}\n")


if __name__ == "__main__":
    print("Generating synthetic MSME dataset...")
    df = generate_profiles(NUM_RECORDS)

    # Save to CSV
    output_path = Path(__file__).parent / "generated_dataset.csv"
    df.to_csv(output_path, index=False)
    print(f"✅ Saved {len(df)} records to {output_path}")

    # Print summary for sanity checking
    print_summary(df)
