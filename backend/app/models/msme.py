"""
CreditLens AI — Pydantic Models for MSME Profiles
"""

from pydantic import BaseModel, Field
from typing import Optional


class MSMEProfile(BaseModel):
    """Full MSME profile with all alternate data features."""
    msme_id: str
    business_name: str
    sector: str
    years_in_operation: float
    employee_count: int
    state: str

    # GST
    gst_filing_regularity_pct: float
    monthly_gst_turnover_avg: float
    gst_turnover_growth_yoy_pct: float
    input_tax_credit_claimed_pct: float

    # UPI
    monthly_upi_inflow_avg: float
    monthly_upi_outflow_avg: float
    upi_transaction_count_monthly: int
    unique_customer_count_monthly: int
    inflow_volatility_score: float

    # AA / Bank
    avg_monthly_bank_balance: float
    emi_bounce_count_12m: int
    existing_emi_obligations_monthly: float
    cash_flow_to_emi_ratio: float

    # EPFO
    epfo_employee_count: int
    epfo_contribution_regularity_pct: float
    employee_count_trend_12m: float


class MSMEListItem(BaseModel):
    """Compact MSME info for list/search views."""
    msme_id: str
    business_name: str
    sector: str
    state: str
    employee_count: int
    monthly_gst_turnover_avg: float
    latest_score: Optional[float] = None
    risk_tier: Optional[str] = None


class MSMECreate(BaseModel):
    """Schema for creating a new MSME profile."""
    business_name: str
    sector: str
    years_in_operation: float = Field(ge=0.5, le=25)
    employee_count: int = Field(ge=1, le=200)
    state: str
    gst_filing_regularity_pct: float = Field(ge=0, le=100)
    monthly_gst_turnover_avg: float = Field(ge=10000)
    gst_turnover_growth_yoy_pct: float = Field(ge=-40, le=80)
    input_tax_credit_claimed_pct: float = Field(ge=0, le=100)
    monthly_upi_inflow_avg: float = Field(ge=5000)
    monthly_upi_outflow_avg: float = Field(ge=0)
    upi_transaction_count_monthly: int = Field(ge=10)
    unique_customer_count_monthly: int = Field(ge=1)
    inflow_volatility_score: float = Field(ge=0, le=1)
    avg_monthly_bank_balance: float = Field(ge=5000)
    emi_bounce_count_12m: int = Field(ge=0, le=12)
    existing_emi_obligations_monthly: float = Field(ge=0)
    cash_flow_to_emi_ratio: float = Field(ge=0)
    epfo_employee_count: int = Field(ge=0)
    epfo_contribution_regularity_pct: float = Field(ge=0, le=100)
    employee_count_trend_12m: float = Field(ge=-30, le=50)
